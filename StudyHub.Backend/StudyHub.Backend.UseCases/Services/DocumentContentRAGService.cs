using Microsoft.Extensions.Configuration;
using PDFtoImage;
using SkiaSharp;
using StudyHub.Backend.UseCases.Repositories;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Tesseract;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
namespace StudyHub.Backend.UseCases.Services
{
    public class DocumentContentRAGService
    {
        private readonly ICloudinaryRepository _fileStorage;
        private readonly EmbeddingService _embeddingService;
        private readonly ElasticDocumentContentService _elasticContentRepo;
        private readonly LLMService _llmService;
        private readonly IConfiguration _configuration;
        private readonly string _tesseractDataPath;
        private readonly IDocumentRepository _repo;


        public DocumentContentRAGService(
     ICloudinaryRepository fileStorage,
     EmbeddingService embeddingService,
     ElasticDocumentContentService elasticContentRepo,
     LLMService llmService,
          IDocumentRepository repo,

     IConfiguration configuration)
        {
            _fileStorage = fileStorage;
            _embeddingService = embeddingService;
            _elasticContentRepo = elasticContentRepo;
            _llmService = llmService;
            _configuration = configuration;
            _repo = repo;
            _tesseractDataPath = configuration["OCR:TesseractDataPath"] ?? "./tessdata";
        }

        public async Task<List<DocumentChunk>> ExtractAndChunkDocumentAsync(int documentId, string documentUrl, string documentName, int subjectId)
        {
            var fileBytes = await _fileStorage.ReadFileAsync(documentUrl);
            var extension = Path.GetExtension(documentUrl).ToLowerInvariant();

            List<DocumentChunk> chunks = new List<DocumentChunk>();

            if (extension == ".pdf")
            {
                chunks = await ExtractPdfContentAsync(documentId, documentName, fileBytes, subjectId);
            }
            else if (extension == ".docx" || extension == ".doc")
            {
                chunks = await ExtractWordContentAsync(documentId, documentName, fileBytes, subjectId);
            }
            else
            {
                throw new NotSupportedException($"File type {extension} is not supported for RAG processing");
            }

            return chunks;
        }

        private async Task<List<DocumentChunk>> ExtractPdfContentAsync(int documentId, string documentName, byte[] fileBytes, int subjectId)
        {
            var chunks = new List<DocumentChunk>();
            var chunkSize = int.Parse(_configuration["RAG:ChunkSize"] ?? "600");
            var overlapSize = int.Parse(_configuration["RAG:OverlapSize"] ?? "100");

            using (var ms = new MemoryStream(fileBytes))
            using (var document = PdfDocument.Open(ms))
            {
                var batchSize = 10;
                for (int batchStart = 1; batchStart <= document.NumberOfPages; batchStart += batchSize)
                {
                    var batchEnd = Math.Min(batchStart + batchSize - 1, document.NumberOfPages);

                    for (int pageNum = batchStart; pageNum <= batchEnd; pageNum++)
                    {
                        var page = document.GetPage(pageNum);
                        var text = page.Text;

                        if (string.IsNullOrWhiteSpace(text))
                        {
                            text = await ExtractTextWithOCR(fileBytes, pageNum);
                        }

                        if (string.IsNullOrWhiteSpace(text))
                        {
                            continue;
                        }

                        text = CleanText(text);
                        var keywords = ExtractKeywords(text, subjectId);
                        var pageChunks = SplitIntoSemanticChunks(text, chunkSize, overlapSize);

                        int chunkIndexInPage = 0;
                        foreach (var chunkText in pageChunks)
                        {
                            if (string.IsNullOrWhiteSpace(chunkText) || chunkText.Length < 50)
                                continue;

                            chunks.Add(new DocumentChunk
                            {
                                DocumentId = documentId,
                                DocumentName = documentName,
                                PageNumber = pageNum,
                                ChunkIndex = chunkIndexInPage,
                                Content = chunkText,
                                Keywords = keywords,
                                CharacterStart = chunkIndexInPage * (chunkSize - overlapSize),
                                CharacterEnd = chunkIndexInPage * (chunkSize - overlapSize) + chunkText.Length,
                                Metadata = new Dictionary<string, string>
                        {
                            { "source", "pdf" },
                            { "page", pageNum.ToString() },
                            { "total_pages", document.NumberOfPages.ToString() },
                            { "extraction_method", string.IsNullOrEmpty(page.Text) ? "ocr" : "text_layer" },
                            { "subject_id", subjectId.ToString() }
                        }
                            });
                            chunkIndexInPage++;
                        }
                    }
                }
            }

            return chunks;
        }

        private async Task<string> ExtractTextWithOCR(byte[] pdfBytes, int pageNumber)
        {
            var enableOCR = bool.Parse(_configuration["OCR:EnableOCR"] ?? "true");
            if (!enableOCR)
            {
                return string.Empty;
            }

            try
            {
                var tesseractPath = _configuration["OCR:TesseractDataPath"] ?? "./tessdata";
                var language = _configuration["OCR:Language"] ?? "vie+eng";

                if (!Directory.Exists(tesseractPath))
                {
                    return string.Empty;
                }

                var langFiles = language.Split('+').Select(l => Path.Combine(tesseractPath, $"{l}.traineddata"));
                foreach (var langFile in langFiles)
                {
                    if (!File.Exists(langFile))
                    {
                        return string.Empty;
                    }
                }

                using var ms = new MemoryStream(pdfBytes);

                var options = new RenderOptions(
                    Dpi: 300,
                    Width: null,
                    Height: null,
                    WithAnnotations: false,
                    WithFormFill: false,
                    WithAspectRatio: true,
                    Rotation: PdfRotation.Rotate0,
                    AntiAliasing: PdfAntiAliasing.All,
                    BackgroundColor: SKColors.White,
                    Bounds: null,
                    UseTiling: false,
                    DpiRelativeToBounds: false
                );

                int currentPage = 0;
                await foreach (var image in Conversion.ToImagesAsync(ms, options: options))
                {
                    currentPage++;

                    if (currentPage < pageNumber)
                    {
                        image.Dispose();
                        continue;
                    }

                    if (currentPage == pageNumber)
                    {
                        try
                        {
                            using (image)
                            {
                                using var memStream = new MemoryStream();
                                if (!image.Encode(memStream, SKEncodedImageFormat.Png, 100))
                                {
                                    return string.Empty;
                                }

                                var imageBytes = memStream.ToArray();

                                if (imageBytes.Length == 0)
                                {
                                    return string.Empty;
                                }

                                TesseractEngine? engine = null;
                                try
                                {
                                    engine = new TesseractEngine(tesseractPath, language, EngineMode.Default);
                                    engine.SetVariable("tessedit_pageseg_mode", "1");
                                    engine.SetVariable("preserve_interword_spaces", "1");
                                }
                                catch (Exception)
                                {
                                    engine?.Dispose();
                                    return string.Empty;
                                }

                                using (engine)
                                {
                                    Pix? pix = null;
                                    try
                                    {
                                        pix = Pix.LoadFromMemory(imageBytes);
                                    }
                                    catch (Exception)
                                    {
                                        pix?.Dispose();
                                        return string.Empty;
                                    }

                                    using (pix)
                                    using (var page = engine.Process(pix))
                                    {
                                        var extractedText = page.GetText();
                                        return extractedText;
                                    }
                                }
                            }
                        }
                        catch (Exception)
                        {
                            return string.Empty;
                        }
                    }

                    image.Dispose();
                    break;
                }

                return string.Empty;
            }
            catch (Exception)
            {
                return string.Empty;
            }
        }
        private async Task<List<DocumentChunk>> ExtractWordContentAsync(int documentId, string documentName, byte[] fileBytes, int subjectId)
        {
            var chunks = new List<DocumentChunk>();
            var chunkSize = int.Parse(_configuration["RAG:ChunkSize"] ?? "600");
            var overlapSize = int.Parse(_configuration["RAG:OverlapSize"] ?? "100");

            using (var ms = new MemoryStream(fileBytes))
            {
                using (var wordDocument = DocumentFormat.OpenXml.Packaging.WordprocessingDocument.Open(ms, false))
                {
                    var body = wordDocument.MainDocumentPart.Document.Body;
                    var paragraphs = body.Elements<DocumentFormat.OpenXml.Wordprocessing.Paragraph>().ToList();

                    Console.WriteLine($"[RAG Indexing DOCX] Total paragraphs: {paragraphs.Count}");

                    var currentPage = 1;
                    var pageText = new StringBuilder();
                    int paragraphIndex = 0;

                    foreach (var paragraph in paragraphs)
                    {
                        var paraText = paragraph.InnerText;

                        var hasPageBreak = paragraph.Descendants<DocumentFormat.OpenXml.Wordprocessing.Break>()
                            .Any(b => b.Type != null && b.Type.Value == DocumentFormat.OpenXml.Wordprocessing.BreakValues.Page);

                        pageText.AppendLine(paraText);

                        if (hasPageBreak || paragraphIndex == paragraphs.Count - 1)
                        {
                            var text = pageText.ToString();
                            text = CleanText(text);

                            if (!string.IsNullOrWhiteSpace(text))
                            {
                                Console.WriteLine($"[RAG Indexing DOCX] Page {currentPage}: {text.Length} chars, {text.Split('\n').Length} lines");

                                var keywords = ExtractKeywords(text, subjectId);
                                var textChunks = SplitIntoSemanticChunks(text, chunkSize, overlapSize);

                                int chunkIndex = 0;
                                foreach (var chunkText in textChunks)
                                {
                                    if (string.IsNullOrWhiteSpace(chunkText) || chunkText.Length < 50)
                                        continue;

                                    var preview = chunkText.Length > 80 ? chunkText.Substring(0, 80) + "..." : chunkText;
                                    Console.WriteLine($"  [DOCX] Page {currentPage}, Chunk {chunkIndex}: {preview}");

                                    chunks.Add(new DocumentChunk
                                    {
                                        DocumentId = documentId,
                                        DocumentName = documentName,
                                        PageNumber = currentPage, 
                                        ChunkIndex = chunkIndex,
                                        Content = chunkText,
                                        Keywords = keywords,
                                        CharacterStart = chunkIndex * (chunkSize - overlapSize),
                                        CharacterEnd = chunkIndex * (chunkSize - overlapSize) + chunkText.Length,
                                        Metadata = new Dictionary<string, string>
                                {
                                    { "source", "docx" },
                                    { "page", currentPage.ToString() },
                                    { "subject_id", subjectId.ToString() },
                                    { "paragraph_index", paragraphIndex.ToString() }  
                                }
                                    });
                                    chunkIndex++;
                                }
                            }

                            if (hasPageBreak)
                            {
                                pageText.Clear();
                                currentPage++;
                            }
                        }

                        paragraphIndex++;
                    }

                    Console.WriteLine($"[RAG Indexing DOCX] Total chunks created: {chunks.Count} across {currentPage} pages");
                }
            }

            return chunks;
        }

        private string CleanText(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            text = Regex.Replace(text, @"\s+", " ");
            text = Regex.Replace(
                text,
                @"[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ.,;:?!(){}[\]""'\-+=/\\]",
                " "
            );
            text = Regex.Replace(text, @"\s+", " ").Trim();

            return text.Trim();
        }

        private List<string> ExtractKeywords(string text, int subjectId)
        {
            var keywords = new HashSet<string>();

            switch (subjectId)
            {
                case 1:
                    var mathKeywords = ExtractMathKeywords(text);
                    foreach (var kw in mathKeywords) keywords.Add(kw);
                    break;
                case 2:
                    var vnKeywords = ExtractVietnameseLiteratureKeywords(text);
                    foreach (var kw in vnKeywords) keywords.Add(kw);
                    break;
                case 3:
                    var engKeywords = ExtractEnglishKeywords(text);
                    foreach (var kw in engKeywords) keywords.Add(kw);
                    break;
                case 4:
                    var physKeywords = ExtractPhysicsKeywords(text);
                    foreach (var kw in physKeywords) keywords.Add(kw);
                    break;
                case 5:
                    var chemKeywords = ExtractChemistryKeywords(text);
                    foreach (var kw in chemKeywords) keywords.Add(kw);
                    break;
                case 6:
                    var bioKeywords = ExtractBiologyKeywords(text);
                    foreach (var kw in bioKeywords) keywords.Add(kw);
                    break;
                case 7:
                    var histKeywords = ExtractHistoryKeywords(text);
                    foreach (var kw in histKeywords) keywords.Add(kw);
                    break;
                case 8:
                    var geoKeywords = ExtractGeographyKeywords(text);
                    foreach (var kw in geoKeywords) keywords.Add(kw);
                    break;
                default:
                    var generalKeywords = ExtractGeneralKeywords(text);
                    foreach (var kw in generalKeywords) keywords.Add(kw);
                    break;
            }

            return keywords.Take(20).ToList();
        }
        private List<string> ExtractBiologyKeywords(string text)
        {
            var keywords = new HashSet<string>();
            var patterns = new[]
            {
        @"\b(tế bào|nhân|chất|gen|NST|nhiễm sắc thể|ADN|ARN|protein|enzyme|quang hợp|" +
        @"hô hấp|sinh sản|di truyền|đột biến|tiến hóa|sinh thái|hệ sinh thái|quần thể|" +
        @"cộng đồng sinh vật|chuỗi thức ăn|lưới thức ăn|sinh vật|động vật|thực vật|" +
        @"nấm|vi sinh vật|vi khuẩn|virus|mô|cơ quan|hệ cơ quan|cơ thể)\b",
        @"\b(DNA|RNA|ATP|CO2|O2|H2O)\b"
    };

            foreach (var pattern in patterns)
            {
                var matches = Regex.Matches(text, pattern, RegexOptions.IgnoreCase);
                foreach (Match match in matches)
                {
                    var keyword = match.Value.Trim().ToLower();
                    if (keyword.Length >= 2)
                        keywords.Add(keyword);
                }
            }

            return keywords.ToList();
        }

        private List<string> ExtractGeographyKeywords(string text)
        {
            var keywords = new HashSet<string>();
            var patterns = new[]
            {
        @"\b(địa hình|khí hậu|thời tiết|nhiệt độ|lượng mưa|gió mùa|địa lý tự nhiên|" +
        @"địa lý kinh tế|dân cư|đô thị|nông thôn|công nghiệp|nông nghiệp|dịch vụ|" +
        @"tài nguyên|môi trường|ô nhiễm|biến đổi khí hậu|núi|sông|biển|đồng bằng|" +
        @"cao nguyên|quần đảo|bán đảo|lãnh thổ|kinh độ|vĩ độ|bản đồ)\b",
        @"\b[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+\s+[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+\b"
    };

            foreach (var pattern in patterns)
            {
                var matches = Regex.Matches(text, pattern, RegexOptions.IgnoreCase);
                foreach (Match match in matches)
                {
                    var keyword = match.Value.Trim().ToLower();
                    if (keyword.Length >= 3)
                        keywords.Add(keyword);
                }
            }

            return keywords.ToList();
        }
        private List<string> ExtractVietnameseLiteratureKeywords(string text)
        {
            var keywords = new HashSet<string>();
            var patterns = new[]
            {
                @"\b(tác phẩm|ác giả|nhân vật|chủ đề|bối cảnh|hình ảnh|biện pháp tu từ|so sánh|ẩn dụ|nhân hóa|" +
                @"đoạn trích|văn bản|tác giả|tác phẩm|thơ|văn xuôi|truyện|tiểu thuyết|thể loại|nội dung|" +
                @"ý nghĩa|giá trị|nghệ thuật|ngôn ngữ|phong cách|cảm xúc|tâm trạng)\b",
                @"\b([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+\s+[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+)\b"
            };

            foreach (var pattern in patterns)
            {
                var matches = Regex.Matches(text, pattern, RegexOptions.IgnoreCase);
                foreach (Match match in matches)
                {
                    var keyword = match.Value.Trim().ToLower();
                    if (keyword.Length >= 3)
                        keywords.Add(keyword);
                }
            }

            return keywords.ToList();
        }

        private List<string> ExtractMathKeywords(string text)
        {
            var keywords = new HashSet<string>();
            var patterns = new[]
            {
                @"\b(phương trình|bất phương trình|bất đẳng thức|hàm số|đạo hàm|tích phân|giới hạn|" +
                @"ma trận|vectơ|số phức|logarit|mũ|căn|sin|cos|tan|cot|lượng giác|hình học|" +
                @"tam giác|tứ giác|đường tròn|elip|parabol|hyperbol|tọa độ|không gian|" +
                @"xác suất|thống kê|tổ hợp|chỉnh hợp|hoán vị|dãy số|cấp số|" +
                @"định lý|bổ đề|hệ quả|chứng minh|giải|tính|biểu thức|công thức)\b",
                @"\b(x|y|z|a|b|c|n|f|g|h)\s*[=<>≤≥≠±∈∉∑∏∫]\s*",
                @"\d+[.,]\d+|\d+\/\d+|\d+"
            };

            foreach (var pattern in patterns)
            {
                var matches = Regex.Matches(text, pattern, RegexOptions.IgnoreCase);
                foreach (Match match in matches)
                {
                    var keyword = match.Value.Trim().ToLower();
                    if (keyword.Length >= 2)
                        keywords.Add(keyword);
                }
            }

            return keywords.ToList();
        }

        private List<string> ExtractEnglishKeywords(string text)
        {
            var keywords = new HashSet<string>();
            var patterns = new[]
            {
                @"\b(grammar|vocabulary|tense|noun|verb|adjective|adverb|pronoun|preposition|" +
                @"conjunction|article|subject|predicate|object|clause|phrase|sentence|" +
                @"present|past|future|perfect|continuous|passive|active|conditional|" +
                @"reading|writing|listening|speaking|comprehension)\b",
                @"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b"
            };

            foreach (var pattern in patterns)
            {
                var matches = Regex.Matches(text, pattern, RegexOptions.IgnoreCase);
                foreach (Match match in matches)
                {
                    var keyword = match.Value.Trim().ToLower();
                    if (keyword.Length >= 3)
                        keywords.Add(keyword);
                }
            }

            return keywords.ToList();
        }

        private List<string> ExtractHistoryKeywords(string text)
        {
            var keywords = new HashSet<string>();
            var patterns = new[]
            {
                @"\b(thế kỷ|năm|niên đại|thời kỳ|giai đoạn|sự kiện|chiến tranh|cách mạng|" +
                @"phong trào|cuộc kháng chiến|độc lập|thống nhất|nhà nước|triều đại|vua|chúa|" +
                @"đế quốc|thuộc địa|giải phóng|đảng|lãnh tụ|anh hùng|danh nhân|di tích|" +
                @"văn hóa|kinh tế|chính trị|xã hội|quân sự|ngoại giao)\b",
                @"\b\d{3,4}\b",
                @"\b[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+\s+[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+\b"
            };

            foreach (var pattern in patterns)
            {
                var matches = Regex.Matches(text, pattern, RegexOptions.IgnoreCase);
                foreach (Match match in matches)
                {
                    var keyword = match.Value.Trim().ToLower();
                    if (keyword.Length >= 3)
                        keywords.Add(keyword);
                }
            }

            return keywords.ToList();
        }

        private List<string> ExtractChemistryKeywords(string text)
        {
            var keywords = new HashSet<string>();
            var patterns = new[]
            {
                @"\b(nguyên tố|hợp chất|phản ứng|phương trình hóa học|oxi hóa|khử|axit|bazơ|muối|" +
                @"kim loại|phi kim|hóa trị|liên kết|ion|phân tử|nguyên tử|electron|proton|neutron|" +
                @"bảng tuần hoàn|nhóm|chu kỳ|dung dịch|nồng độ|mol|khối lượng mol|thể tích mol|" +
                @"cân bằng|tốc độ|xúc tác|nhiệt hóa học|điện hóa|hữu cơ|vô cơ)\b",
                @"\b(H|He|Li|Be|B|C|N|O|F|Ne|Na|Mg|Al|Si|P|S|Cl|Ar|K|Ca|Fe|Cu|Zn|Ag|Au)\d*\b",
                @"\b[A-Z][a-z]?\d*(?:\s*[+\-→←↔]\s*[A-Z][a-z]?\d*)+\b"
            };

            foreach (var pattern in patterns)
            {
                var matches = Regex.Matches(text, pattern, RegexOptions.IgnoreCase);
                foreach (Match match in matches)
                {
                    var keyword = match.Value.Trim().ToLower();
                    if (keyword.Length >= 2)
                        keywords.Add(keyword);
                }
            }

            return keywords.ToList();
        }

        private List<string> ExtractPhysicsKeywords(string text)
        {
            var keywords = new HashSet<string>();
            var patterns = new[]
            {
                @"\b(lực|vận tốc|gia tốc|khối lượng|trọng lượng|áp suất|nhiệt độ|năng lượng|công|công suất|" +
                @"động lượng|xung lượng|moment|quán tính|ma sát|trọng trường|điện trường|từ trường|" +
                @"điện tích|dòng điện|điện áp|điện trở|công suất điện|định luật|nguyên lý|" +
                @"sóng|âm|ánh sáng|quang học|cơ học|nhiệt học|điện học|từ học|hạt nhân|" +
                @"Newton|Ohm|Coulomb|Faraday|Ampere|Volt|Watt|Joule)\b",
                @"\b\d+\s*(m|kg|s|N|J|W|A|V|Ω|Hz|Pa|K|°C)\b"
            };

            foreach (var pattern in patterns)
            {
                var matches = Regex.Matches(text, pattern, RegexOptions.IgnoreCase);
                foreach (Match match in matches)
                {
                    var keyword = match.Value.Trim().ToLower();
                    if (keyword.Length >= 2)
                        keywords.Add(keyword);
                }
            }

            return keywords.ToList();
        }

        private List<string> ExtractGeneralKeywords(string text)
        {
            var keywords = new HashSet<string>();

            var words = text.Split(new[] { ' ', '\n', '\t', '.', ',', ';', ':', '!', '?' },
                StringSplitOptions.RemoveEmptyEntries);

            foreach (var word in words)
            {
                var cleaned = word.Trim().ToLower();
                if (cleaned.Length >= 3 && !IsStopWord(cleaned))
                {
                    keywords.Add(cleaned);
                }
            }

            for (int i = 0; i < words.Length - 1; i++)
            {
                var word1 = words[i].Trim().ToLower();
                var word2 = words[i + 1].Trim().ToLower();

                if (word1.Length >= 3 && word2.Length >= 3 &&
                    !IsStopWord(word1) && !IsStopWord(word2))
                {
                    keywords.Add($"{word1} {word2}");
                }
            }

            return keywords.OrderByDescending(k => k.Length).Take(50).ToList();
        }

        private bool IsStopWord(string word)
        {
            var stopWords = new HashSet<string>
            {
                "là", "của", "và", "có", "được", "trong", "các", "để", "với", "một", "này", "đó",
                "không", "những", "cho", "từ", "theo", "như", "về", "trên", "khi", "cũng", "hay",
                "the", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
                "do", "does", "did", "will", "would", "should", "could", "may", "might", "must",
                "can", "a", "an", "the", "and", "or", "but", "if", "then", "of", "at", "by", "for",
                "with", "about", "as", "into", "through", "during", "before", "after", "above"
            };
            return stopWords.Contains(word);
        }

        private List<string> SplitIntoSemanticChunks(string text, int chunkSize, int overlapSize)
        {
            var chunks = new List<string>();

            var sentences = System.Text.RegularExpressions.Regex.Split(
                text,
                @"(?<=[.!?;])\s+(?=[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ])"
            ).Where(s => !string.IsNullOrWhiteSpace(s)).ToList();

            if (sentences.Count == 0)
                return chunks;

            var currentChunk = new StringBuilder();
            var currentLength = 0;
            var sentencesInChunk = new List<string>();

            foreach (var sentence in sentences)
            {
                var trimmedSentence = sentence.Trim();
                if (string.IsNullOrEmpty(trimmedSentence))
                    continue;

                var sentenceLength = trimmedSentence.Length;

                if (currentLength + sentenceLength > chunkSize && currentLength > 0)
                {
                    chunks.Add(currentChunk.ToString().Trim());

                    var overlapSentences = GetOverlapSentences(sentencesInChunk, overlapSize);
                    currentChunk = new StringBuilder(string.Join(" ", overlapSentences));
                    currentLength = currentChunk.Length;

                    sentencesInChunk = overlapSentences.ToList();
                }

                currentChunk.Append(trimmedSentence).Append(" ");
                currentLength += sentenceLength + 1;
                sentencesInChunk.Add(trimmedSentence);
            }

            if (currentLength > 0)
            {
                chunks.Add(currentChunk.ToString().Trim());
            }

            return chunks;
        }

        private List<string> GetOverlapSentences(List<string> sentences, int overlapSize)
        {
            var overlap = new List<string>();
            var currentLength = 0;

            for (int i = sentences.Count - 1; i >= 0; i--)
            {
                if (currentLength + sentences[i].Length > overlapSize && overlap.Count > 0)
                    break;

                overlap.Insert(0, sentences[i]);
                currentLength += sentences[i].Length + 1;
            }

            return overlap;
        }

        public async Task<RAGIndexingResult> IndexDocumentForRAGAsync(int documentId, string documentUrl, string documentName, int subjectId)
        {
            var result = new RAGIndexingResult
            {
                DocumentId = documentId,
                DocumentName = documentName,
                StartTime = DateTime.Now
            };

            try
            {
                var chunks = await ExtractAndChunkDocumentAsync(documentId, documentUrl, documentName, subjectId);
                result.TotalChunks = chunks.Count;

                if (chunks.Count == 0)
                {
                    result.Success = false;
                    result.ErrorMessage = "No text content found in document";
                    return result;
                }

                var batchSize = int.Parse(_configuration["RAG:EmbeddingBatchSize"] ?? "10");

                for (int i = 0; i < chunks.Count; i += batchSize)
                {
                    var batch = chunks.Skip(i).Take(batchSize).ToList();
                    var chunkTexts = batch.Select(c => c.Content).ToList();

                    var embeddings = await _embeddingService.GetEmbeddingsBatchAsync(chunkTexts, batchSize);

                    for (int j = 0; j < batch.Count; j++)
                    {
                        batch[j].ContentVector = embeddings[j];
                    }

                    result.ChunksProcessed += batch.Count;
                }

                var indexSuccess = await _elasticContentRepo.IndexDocumentChunksBatchAsync(chunks);

                if (!indexSuccess)
                {
                    result.Success = false;
                    result.ErrorMessage = "Failed to index chunks to Elasticsearch";
                    return result;
                }

                result.Success = true;
                result.EndTime = DateTime.Now;
                result.ProcessingTimeSeconds = (result.EndTime - result.StartTime).TotalSeconds;

                return result;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.ErrorMessage = ex.Message;
                result.EndTime = DateTime.Now;
                return result;
            }
        }
        public async Task<List<DocumentChunk>> RetrieveRelevantChunksAsync(
            int documentId,
            string query,
            int topK = 5)
        {
            var document = _repo.GetDocumentById(documentId);
            if (document == null)
                throw new InvalidOperationException("Document not found");

            var keywords = ExtractKeywords(query, document.SubjectId);
            var enrichedQuery = string.Join(" ", keywords.Concat(new[] { query }));
            var queryVector = await _embeddingService.GetEmbeddingAsync(enrichedQuery);

            var searchResults = await _elasticContentRepo.SearchDocumentContentAsync(
                documentId, enrichedQuery, queryVector, topK * 3);

            if (!searchResults.IsValid || !searchResults.Hits.Any())
                return new List<DocumentChunk>();

            var chunks = searchResults.Hits
                .Where(hit => hit.Score.HasValue && hit.Score.Value > 0.3)  
                .Select(hit => new DocumentChunk
                {
                    DocumentId = hit.Source.DocumentId,
                    DocumentName = hit.Source.DocumentName,
                    PageNumber = hit.Source.PageNumber,
                    ChunkIndex = hit.Source.ChunkIndex,
                    Content = hit.Source.Content,
                    Keywords = hit.Source.Keywords,
                    ContentVector = hit.Source.ContentVector,
                    CharacterStart = hit.Source.CharacterStart,
                    CharacterEnd = hit.Source.CharacterEnd,
                    Score = (float)hit.Score.Value,
                    Metadata = hit.Source.Metadata
                })
                .ToList();

            var queryTerms = query.ToLower().Split(' ').Where(w => w.Length > 2).ToHashSet();

            chunks = chunks.Select(chunk =>
            {
                var content = chunk.Content.ToLower();
                var matchCount = queryTerms.Count(term => content.Contains(term));
                var matchRatio = (double)matchCount / queryTerms.Count;

                chunk.Score *= (float)(1.0 + (matchRatio * 0.5));

                return chunk;
            })
            .OrderByDescending(c => c.Score)
            .Take(topK)
            .ToList();

            return chunks;
        }
        public async Task<RAGAnswer> AskQuestionAsync(int documentId, string question, int maxChunks = 5)
        {
            var result = new RAGAnswer
            {
                Question = question,
                DocumentId = documentId
            };

            try
            {
                var relevantChunks = await RetrieveRelevantChunksAsync(documentId, question, maxChunks);

                if (relevantChunks.Count == 0)
                {
                    result.Answer = "Không tìm thấy thông tin liên quan trong tài liệu.";
                    result.Confidence = 0.0f;
                    return result;
                }

                result.SourceChunks = relevantChunks;

                var context = BuildContextFromChunks(relevantChunks);
                var prompt = BuildRAGPrompt(question, context, relevantChunks);
                var (answer, promptTokens, completionTokens) = await _llmService.GenerateResponseAsync(prompt);

                result.Answer = answer;
                result.Confidence = CalculateConfidence(relevantChunks);
                result.PromptTokens = promptTokens;
                result.CompletionTokens = completionTokens;

                return result;
            }
            catch (Exception ex)
            {
                result.Answer = $"Lỗi: {ex.Message}";
                result.Confidence = 0.0f;
                return result;
            }
        }

        private string BuildContextFromChunks(List<DocumentChunk> chunks)
        {
            var contextBuilder = new StringBuilder();
            int maxContextLength = 2500;
            int currentLength = 0;

            foreach (var chunk in chunks.OrderByDescending(c => c.Score))
            {
                var keywords = chunk.Keywords != null && chunk.Keywords.Any()
                    ? $"[Keywords: {string.Join(", ", chunk.Keywords.Take(5))}]"
                    : "";
                var chunkText = $"[Trang {chunk.PageNumber}] {keywords}\n{chunk.Content}\n\n";

                if (currentLength + chunkText.Length > maxContextLength)
                {
                    int remaining = maxContextLength - currentLength;
                    if (remaining > 100)
                    {
                        contextBuilder.AppendLine(chunkText.Substring(0, remaining) + "...");
                    }
                    break;
                }

                contextBuilder.AppendLine(chunkText);
                currentLength += chunkText.Length;
            }

            return contextBuilder.ToString();
        }

        private string BuildRAGPrompt(string question, string context, List<DocumentChunk> chunks)
        {
            var sourcePages = string.Join(", ", chunks.Select(c => c.PageNumber).Distinct().OrderBy(p => p));

            return $@"Trả lời câu hỏi dựa trên ngữ cảnh được cung cấp.

NGUYÊN TẮC:
- Chỉ sử dụng thông tin từ ngữ cảnh
- Nếu không tìm thấy thông tin, nói rõ ràng
- Trích dẫn trang cụ thể
- Trả lời ngắn gọn, đúng trọng tâm, đơn giản hóa câu trả lời, hạn chế lời nói màu mè
- Trả lời bằng văn xuôi tự nhiên, không dùng ký hiệu đặc biệt
- KHÔNG sử dụng markdown formatting (**, __, ##, etc.) - chỉ dùng text thuần
- KHÔNG thêm thông tin bên ngoài ngữ cảnh
- KHÔNG đoán mò hoặc suy luận trừ khi người dùng yêu cầu
- Nếu ngữ cảnh không đủ, trả lời rằng không đủ thông tin
- Luôn trích dẫn trang từ ngữ cảnh trong câu trả lời
- Nếu có nhiều trang, liệt kê tất cả trang được sử dụng

NGỮ CẢNH (Trang: {sourcePages}):
{context}

CÂU HỎI: {question}

TRẢ LỜI:";
        }

        private float CalculateConfidence(List<DocumentChunk> chunks)
        {
            if (chunks.Count == 0)
                return 0.0f;

            var avgScore = chunks.Average(c => c.Score);
            var countFactor = Math.Min(chunks.Count / 5.0f, 1.0f);

            return (avgScore * 0.7f) + (countFactor * 0.3f);
        }

        public async Task<RAGAnswer> ContinueConversationAsync(int documentId, string question, List<ConversationTurn> conversationHistory, int maxChunks = 5)
        {
            var result = new RAGAnswer
            {
                Question = question,
                DocumentId = documentId
            };

            try
            {
                var contextualizedQuery = BuildContextualizedQuery(question, conversationHistory);
                var relevantChunks = await RetrieveRelevantChunksAsync(documentId, contextualizedQuery, maxChunks);

                if (relevantChunks.Count == 0)
                {
                    result.Answer = "Không tìm thấy thông tin liên quan trong tài liệu.";
                    result.Confidence = 0.0f;
                    return result;
                }

                result.SourceChunks = relevantChunks;

                var documentContext = BuildContextFromChunks(relevantChunks);
                var prompt = BuildConversationPrompt(question, documentContext, conversationHistory);

                var (answer, promptTokens, completionTokens) = await _llmService.GenerateResponseAsync(prompt);

                result.Answer = answer;
                result.Confidence = CalculateConfidence(relevantChunks);
                result.PromptTokens = promptTokens;
                result.CompletionTokens = completionTokens;

                return result;
            }
            catch (Exception ex)
            {
                result.Answer = $"Lỗi: {ex.Message}";
                result.Confidence = 0.0f;
                return result;
            }
        }

        private string BuildContextualizedQuery(string currentQuestion, List<ConversationTurn> history)
        {
            if (history == null || history.Count == 0)
                return currentQuestion;

            var recentHistory = history.TakeLast(2).ToList();
            var contextParts = new List<string>();

            foreach (var turn in recentHistory)
            {
                contextParts.Add(turn.Question);
            }

            contextParts.Add(currentQuestion);

            return string.Join(" ", contextParts);
        }

        private string BuildConversationPrompt(string currentQuestion, string documentContext, List<ConversationTurn> history)
        {
            var conversationHistory = new StringBuilder();

            if (history != null && history.Count > 0)
            {
                conversationHistory.AppendLine("LỊCH SỬ:");
                foreach (var turn in history.TakeLast(3))
                {
                    conversationHistory.AppendLine($"Q: {turn.Question}");
                    conversationHistory.AppendLine($"A: {turn.Answer}");
                }
            }

            return $@"Trả lời câu hỏi dựa trên ngữ cảnh tài liệu và lịch sử hội thoại.

NGUYÊN TẮC:
- Trả lời ngắn gọn, tự nhiên
- KHÔNG dùng markdown formatting (**, __, ##)
- Chỉ dùng text thuần, không ký hiệu đặc biệt

{conversationHistory}

NGỮ CẢNH:
{documentContext}

CÂU HỎI: {currentQuestion}

TRẢ LỜI:";
        }

        public async Task<bool> DeleteDocumentIndexAsync(int documentId)
        {
            return await _elasticContentRepo.DeleteDocumentChunksByDocumentIdAsync(documentId);
        }

        public async Task<DocumentIndexStats> GetDocumentIndexStatsAsync(int documentId)
        {
            return await _elasticContentRepo.GetDocumentStatsAsync(documentId);
        }
    }

    public class DocumentChunk
    {
        public int DocumentId { get; set; }
        public string DocumentName { get; set; } = string.Empty;
        public int PageNumber { get; set; }
        public int ChunkIndex { get; set; }
        public string Content { get; set; } = string.Empty;
        public List<string> Keywords { get; set; } = new List<string>();
        public float[] ContentVector { get; set; } = Array.Empty<float>();
        public int CharacterStart { get; set; }
        public int CharacterEnd { get; set; }
        public float Score { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new();
    }

    public class RAGIndexingResult
    {
        public int DocumentId { get; set; }
        public string DocumentName { get; set; } = string.Empty;
        public bool Success { get; set; }
        public int TotalChunks { get; set; }
        public int ChunksProcessed { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public double ProcessingTimeSeconds { get; set; }
    }

    public class RAGAnswer
    {
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
        public int DocumentId { get; set; }
        public float Confidence { get; set; }
        public List<DocumentChunk> SourceChunks { get; set; } = new();
        public int PromptTokens { get; set; }
        public int CompletionTokens { get; set; }
    }

    public class ConversationTurn
    {
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class DocumentIndexStats
    {
        public int DocumentId { get; set; }
        public int TotalChunks { get; set; }
        public int TotalPages { get; set; }
        public DateTime? LastIndexed { get; set; }
        public long TotalCharacters { get; set; }
    }
}