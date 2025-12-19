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

        public DocumentContentRAGService(
     ICloudinaryRepository fileStorage,
     EmbeddingService embeddingService,
     ElasticDocumentContentService elasticContentRepo,
     LLMService llmService,
     IConfiguration configuration)
        {
            _fileStorage = fileStorage;
            _embeddingService = embeddingService;
            _elasticContentRepo = elasticContentRepo;
            _llmService = llmService;
            _configuration = configuration;

            _tesseractDataPath = configuration["OCR:TesseractDataPath"] ?? "./tessdata";
        }

        public async Task<List<DocumentChunk>> ExtractAndChunkDocumentAsync(int documentId, string documentUrl, string documentName)
        {
            var fileBytes = await _fileStorage.ReadFileAsync(documentUrl);
            var extension = Path.GetExtension(documentUrl).ToLowerInvariant();

            List<DocumentChunk> chunks = new List<DocumentChunk>();

            if (extension == ".pdf")
            {
                chunks = await ExtractPdfContentAsync(documentId, documentName, fileBytes);
            }
            else if (extension == ".docx" || extension == ".doc")
            {
                chunks = await ExtractWordContentAsync(documentId, documentName, fileBytes);
            }
            else
            {
                throw new NotSupportedException($"File type {extension} is not supported for RAG processing");
            }

            return chunks;
        }

        private async Task<List<DocumentChunk>> ExtractPdfContentAsync(int documentId, string documentName, byte[] fileBytes)
        {
            var chunks = new List<DocumentChunk>();
            var chunkSize = int.Parse(_configuration["RAG:ChunkSize"] ?? "800");
            var overlapSize = int.Parse(_configuration["RAG:OverlapSize"] ?? "200");

            using (var ms = new MemoryStream(fileBytes))
            using (var document = PdfDocument.Open(ms))
            {
                Console.WriteLine($"Processing PDF: {documentName}, Total pages: {document.NumberOfPages}");

                var batchSize = 10;
                for (int batchStart = 1; batchStart <= document.NumberOfPages; batchStart += batchSize)
                {
                    var batchEnd = Math.Min(batchStart + batchSize - 1, document.NumberOfPages);
                    Console.WriteLine($"Processing pages {batchStart} to {batchEnd}...");

                    for (int pageNum = batchStart; pageNum <= batchEnd; pageNum++)
                    {
                        var page = document.GetPage(pageNum);
                        var text = page.Text;

                        if (string.IsNullOrWhiteSpace(text))
                        {
                            Console.WriteLine($"Page {pageNum} has no text layer, attempting OCR...");
                            text = await ExtractTextWithOCR(fileBytes, pageNum);
                        }

                        if (string.IsNullOrWhiteSpace(text))
                        {
                            Console.WriteLine($"Page {pageNum} is empty even after OCR, skipping...");
                            continue;
                        }

                        text = CleanText(text);
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
                                CharacterStart = chunkIndexInPage * (chunkSize - overlapSize),
                                CharacterEnd = chunkIndexInPage * (chunkSize - overlapSize) + chunkText.Length,
                                Metadata = new Dictionary<string, string>
                        {
                            { "source", "pdf" },
                            { "page", pageNum.ToString() },
                            { "total_pages", document.NumberOfPages.ToString() },
                            { "extraction_method", string.IsNullOrEmpty(page.Text) ? "ocr" : "text_layer" }
                        }
                            });
                            chunkIndexInPage++;
                        }
                    }
                }

                Console.WriteLine($"Total chunks created: {chunks.Count}");
            }

            return chunks;
        }
        private async Task<string> ExtractTextWithOCR(byte[] pdfBytes, int pageNumber)
        {
            var enableOCR = bool.Parse(_configuration["OCR:EnableOCR"] ?? "true");
            if (!enableOCR)
            {
                Console.WriteLine("OCR is disabled in configuration");
                return string.Empty;
            }

            try
            {
                Console.WriteLine($"[OCR] Processing page {pageNumber} with Tesseract...");

                var tesseractPath = _configuration["OCR:TesseractDataPath"] ?? "./tessdata";
                var language = _configuration["OCR:Language"] ?? "vie+eng";

                if (!Directory.Exists(tesseractPath))
                {
                    Console.WriteLine($"[OCR] ERROR: Tessdata directory not found: {tesseractPath}");
                    return string.Empty;
                }

                var langFiles = language.Split('+').Select(l => Path.Combine(tesseractPath, $"{l}.traineddata"));
                foreach (var langFile in langFiles)
                {
                    if (!File.Exists(langFile))
                    {
                        Console.WriteLine($"[OCR] ERROR: Language file not found: {langFile}");
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
                                    Console.WriteLine($"[OCR] ERROR: Failed to encode image for page {pageNumber}");
                                    return string.Empty;
                                }

                                var imageBytes = memStream.ToArray();

                                if (imageBytes.Length == 0)
                                {
                                    Console.WriteLine($"[OCR] ERROR: Empty image bytes for page {pageNumber}");
                                    return string.Empty;
                                }

                                Console.WriteLine($"[OCR] Image size: {imageBytes.Length} bytes");

                                TesseractEngine? engine = null;
                                try
                                {
                                    engine = new TesseractEngine(tesseractPath, language, EngineMode.Default);
                                    engine.SetVariable("tessedit_pageseg_mode", "1");
                                    engine.SetVariable("preserve_interword_spaces", "1");
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"[OCR] ERROR: Failed to initialize Tesseract engine: {ex.Message}");
                                    Console.WriteLine($"[OCR] Tessdata path: {tesseractPath}");
                                    Console.WriteLine($"[OCR] Language: {language}");
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
                                    catch (Exception ex)
                                    {
                                        Console.WriteLine($"[OCR] ERROR: Failed to load image into Pix: {ex.Message}");
                                        pix?.Dispose();
                                        return string.Empty;
                                    }

                                    using (pix)
                                    using (var page = engine.Process(pix))
                                    {
                                        var extractedText = page.GetText();
                                        var confidence = page.GetMeanConfidence();

                                        Console.WriteLine($"[OCR] Page {pageNumber}: {extractedText.Length} chars, confidence: {confidence:P}");

                                        return extractedText;
                                    }
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[OCR] ERROR processing page {pageNumber}: {ex.Message}");
                            Console.WriteLine($"[OCR] Stack trace: {ex.StackTrace}");
                            if (ex.InnerException != null)
                            {
                                Console.WriteLine($"[OCR] Inner exception: {ex.InnerException.Message}");
                            }
                            return string.Empty;
                        }
                    }

                    image.Dispose();
                    break;
                }

                return string.Empty;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[OCR] Failed for page {pageNumber}: {ex.Message}");
                Console.WriteLine($"[OCR] Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[OCR] Inner exception: {ex.InnerException.Message}");
                }
                return string.Empty;
            }
        }
        private async Task<List<DocumentChunk>> ExtractWordContentAsync(int documentId, string documentName, byte[] fileBytes)
        {
            var chunks = new List<DocumentChunk>();
            var chunkSize = int.Parse(_configuration["RAG:ChunkSize"] ?? "800");
            var overlapSize = int.Parse(_configuration["RAG:OverlapSize"] ?? "200");

            using (var ms = new MemoryStream(fileBytes))
            {
                using (var wordDocument = DocumentFormat.OpenXml.Packaging.WordprocessingDocument.Open(ms, false))
                {
                    var body = wordDocument.MainDocumentPart.Document.Body;
                    var fullText = body.InnerText;

                    fullText = CleanText(fullText);
                    var textChunks = SplitIntoSemanticChunks(fullText, chunkSize, overlapSize);

                    int chunkIndex = 0;
                    foreach (var chunkText in textChunks)
                    {
                        if (string.IsNullOrWhiteSpace(chunkText) || chunkText.Length < 50)
                            continue;

                        chunks.Add(new DocumentChunk
                        {
                            DocumentId = documentId,
                            DocumentName = documentName,
                            PageNumber = 1,
                            ChunkIndex = chunkIndex,
                            Content = chunkText,
                            CharacterStart = chunkIndex * (chunkSize - overlapSize),
                            CharacterEnd = chunkIndex * (chunkSize - overlapSize) + chunkText.Length,
                            Metadata = new Dictionary<string, string>
                            {
                                { "source", "docx" }
                            }
                        });
                        chunkIndex++;
                    }
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

        public async Task<RAGIndexingResult> IndexDocumentForRAGAsync(int documentId, string documentUrl, string documentName)
        {
            var result = new RAGIndexingResult
            {
                DocumentId = documentId,
                DocumentName = documentName,
                StartTime = DateTime.Now
            };

            try
            {
                Console.WriteLine($"[RAG] Starting indexing for document {documentId}: {documentName}");

                Console.WriteLine("[RAG] Step 1: Extracting and chunking document...");
                var chunks = await ExtractAndChunkDocumentAsync(documentId, documentUrl, documentName);
                result.TotalChunks = chunks.Count;

                if (chunks.Count == 0)
                {
                    result.Success = false;
                    result.ErrorMessage = "No text content found in document";
                    return result;
                }

                Console.WriteLine($"[RAG] Extracted {chunks.Count} chunks");

                Console.WriteLine("[RAG] Step 2: Generating embeddings...");
                var batchSize = int.Parse(_configuration["RAG:EmbeddingBatchSize"] ?? "10");

                for (int i = 0; i < chunks.Count; i += batchSize)
                {
                    var batch = chunks.Skip(i).Take(batchSize).ToList();
                    var chunkTexts = batch.Select(c => c.Content).ToList();

                    Console.WriteLine($"[RAG] Processing embedding batch {i / batchSize + 1}/{(chunks.Count + batchSize - 1) / batchSize}");
                    var embeddings = await _embeddingService.GetEmbeddingsBatchAsync(chunkTexts, batchSize);

                    for (int j = 0; j < batch.Count; j++)
                    {
                        batch[j].ContentVector = embeddings[j];
                    }

                    result.ChunksProcessed += batch.Count;
                }

                Console.WriteLine($"[RAG] Generated embeddings for {result.ChunksProcessed} chunks");

                Console.WriteLine("[RAG] Step 3: Indexing to Elasticsearch...");
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

                Console.WriteLine($"[RAG] Indexing completed in {result.ProcessingTimeSeconds:F2} seconds");

                return result;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.ErrorMessage = ex.Message;
                result.EndTime = DateTime.Now;
                Console.WriteLine($"[RAG] Error: {ex.Message}");
                return result;
            }
        }

        // DocumentContentRAGService.cs
        public async Task<List<DocumentChunk>> RetrieveRelevantChunksAsync(
            int documentId,
            string query,
            int topK = 5)
        {
            var queryVector = await _embeddingService.GetEmbeddingAsync(query);

            // ✅ CHỈ LẤY topK thay vì topK * 2
            var searchResults = await _elasticContentRepo.SearchDocumentContentAsync(
                documentId, query, queryVector, topK);

            if (!searchResults.IsValid || !searchResults.Hits.Any())
                return new List<DocumentChunk>();

            // ✅ Tăng threshold để lọc chunks kém liên quan
            var chunks = searchResults.Hits
                .Where(hit => hit.Score.HasValue && hit.Score.Value > 0.3) // Tăng từ 0.1 lên 0.3
                .Take(topK)
                .Select(hit => new DocumentChunk
                {
                    DocumentId = hit.Source.DocumentId,
                    DocumentName = hit.Source.DocumentName,
                    PageNumber = hit.Source.PageNumber,
                    ChunkIndex = hit.Source.ChunkIndex,
                    Content = hit.Source.Content,
                    ContentVector = hit.Source.ContentVector,
                    CharacterStart = hit.Source.CharacterStart,
                    CharacterEnd = hit.Source.CharacterEnd,
                    Score = (float)hit.Score.Value,
                    Metadata = hit.Source.Metadata
                })
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
                Console.WriteLine($"[RAG QA] Question: {question}");

                var relevantChunks = await RetrieveRelevantChunksAsync(documentId, question, maxChunks);

                if (relevantChunks.Count == 0)
                {
                    result.Answer = "Không tìm thấy thông tin liên quan trong tài liệu để trả lời câu hỏi này.";
                    result.Confidence = 0.0f;
                    return result;
                }

                result.SourceChunks = relevantChunks;

                var context = BuildContextFromChunks(relevantChunks);
                Console.WriteLine($"[RAG QA] Built context from {relevantChunks.Count} chunks");

                var prompt = BuildRAGPrompt(question, context, relevantChunks);
                var (answer, promptTokens, completionTokens) = await _llmService.GenerateResponseAsync(prompt);

                result.Answer = answer;
                result.Confidence = CalculateConfidence(relevantChunks);
                result.PromptTokens = promptTokens;
                result.CompletionTokens = completionTokens;

                Console.WriteLine($"[RAG QA] Answer generated (tokens: {promptTokens + completionTokens})");

                return result;
            }
            catch (Exception ex)
            {
                result.Answer = $"Lỗi khi xử lý câu hỏi: {ex.Message}";
                result.Confidence = 0.0f;
                return result;
            }
        }

        private string BuildContextFromChunks(List<DocumentChunk> chunks)
        {
            var contextBuilder = new StringBuilder();
            int maxContextLength = 3000; // ✅ Giới hạn tổng độ dài context
            int currentLength = 0;

            foreach (var chunk in chunks.OrderByDescending(c => c.Score)) // ✅ Ưu tiên chunks có score cao
            {
                var chunkText = $"[Trang {chunk.PageNumber}, Điểm: {chunk.Score:F2}]\n{chunk.Content}\n\n";

                if (currentLength + chunkText.Length > maxContextLength)
                {
                    // ✅ Cắt bớt nếu quá dài
                    int remaining = maxContextLength - currentLength;
                    if (remaining > 100) // Chỉ thêm nếu còn đủ chỗ
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

            return $@"Bạn là một trợ lý AI thông minh giúp trả lời câu hỏi dựa trên nội dung tài liệu.

NHIỆM VỤ: Trả lời câu hỏi của người dùng dựa HOÀN TOÀN trên ngữ cảnh được cung cấp.

NGUYÊN TẮC:
1. CHỈ sử dụng thông tin từ ngữ cảnh được cung cấp
2. Nếu không tìm thấy thông tin, hãy nói rõ ràng
3. Trích dẫn trang cụ thể khi trả lời
4. Trả lời chi tiết, rõ ràng bằng Tiếng Việt
5. Nếu có công thức toán học, hãy giải thích rõ ràng
6. Tổ chức câu trả lời có cấu trúc, dễ hiểu

NGỮ CẢNH TỪ TÀI LIỆU (Các trang: {sourcePages}):
{context}

CÂU HỎI: {question}

TRẢ LỜI (bằng Tiếng Việt, có trích dẫn trang):";
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
                Console.WriteLine($"[RAG Conversation] Contextualized query: {contextualizedQuery}");

                var relevantChunks = await RetrieveRelevantChunksAsync(documentId, contextualizedQuery, maxChunks);

                if (relevantChunks.Count == 0)
                {
                    result.Answer = "Không tìm thấy thông tin liên quan trong tài liệu để trả lời câu hỏi này.";
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
                result.Answer = $"Lỗi khi xử lý câu hỏi: {ex.Message}";
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
                conversationHistory.AppendLine("LỊCH SỬ HỘI THOẠI:");
                foreach (var turn in history.TakeLast(3))
                {
                    conversationHistory.AppendLine($"Người dùng: {turn.Question}");
                    conversationHistory.AppendLine($"AI: {turn.Answer}");
                    conversationHistory.AppendLine();
                }
            }

            return $@"Bạn là một trợ lý AI thông minh giúp trả lời câu hỏi dựa trên nội dung tài liệu.

NHIỆM VỤ: Trả lời câu hỏi của người dùng dựa trên ngữ cảnh tài liệu và lịch sử hội thoại.

NGUYÊN TẮC:
1. CHỈ sử dụng thông tin từ ngữ cảnh tài liệu được cung cấp
2. Tham khảo lịch sử hội thoại để hiểu ngữ cảnh
3. Trích dẫn trang cụ thể khi trả lời
4. Trả lời mạch lạc, liên kết với cuộc trò chuyện trước đó nếu có liên quan

{conversationHistory}

NGỮ CẢNH TỪ TÀI LIỆU:
{documentContext}

CÂU HỎI HIỆN TẠI: {currentQuestion}

TRẢ LỜI (bằng Tiếng Việt, có trích dẫn trang):";
        }

        public async Task<bool> DeleteDocumentIndexAsync(int documentId)
        {
            Console.WriteLine($"[RAG] Deleting index for document {documentId}");
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