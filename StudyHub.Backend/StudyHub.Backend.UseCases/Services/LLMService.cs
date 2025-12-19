using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using RestSharp;
using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Utils;

namespace StudyHub.Backend.UseCases.Services
{
    public class LLMService
    {
        private readonly RestClient _client;
        private readonly IConfiguration configuration;

        public LLMService(IConfiguration configuration)
        {
            this.configuration = configuration;
            _client = new RestClient("https://router.huggingface.co/v1/chat/completions");
        }

        // Helper: parse a JSON array of question objects into typed GeneratedQuestionDto list
        private List<StudyHub.Backend.UseCases.Dtos.GeneratedQuestionDto> ParseGeneratedQuestions(string jsonArray, QuestionType qType)
        {
            var result = new List<StudyHub.Backend.UseCases.Dtos.GeneratedQuestionDto>();
            if (string.IsNullOrWhiteSpace(jsonArray)) return result;

            try
            {
                using var doc = JsonDocument.Parse(jsonArray);
                var root = doc.RootElement;
                if (root.ValueKind != JsonValueKind.Array) return result;

                foreach (var item in root.EnumerateArray())
                {
                    try
                    {
                        var q = new StudyHub.Backend.UseCases.Dtos.GeneratedQuestionDto();
                        q.QuestionType = qType;
                        if (item.TryGetProperty("questionText", out var qt) && qt.ValueKind == JsonValueKind.String)
                            q.QuestionText = qt.GetString() ?? string.Empty;

                        // Determine questionType: accept numeric or string values and map to domain enum
                        //StudyHub.Backend.Domain.Entities.Exam.QuestionType? qEnum = null;
                        //int? qTypeNumeric = null;
                        //if (item.TryGetProperty("questionType", out var qtp))
                        //{
                        //    if (qtp.ValueKind == JsonValueKind.Number && qtp.TryGetInt32(out var qnum))
                        //    {
                        //        qTypeNumeric = qnum;
                        //        if (Enum.IsDefined(typeof(StudyHub.Backend.Domain.Entities.Exam.QuestionType), qnum))
                        //            qEnum = (StudyHub.Backend.Domain.Entities.Exam.QuestionType)qnum;
                        //    }
                        //    else if (qtp.ValueKind == JsonValueKind.String)
                        //    {
                        //        var qtypeStr = qtp.GetString() ?? string.Empty;
                        //        if (int.TryParse(qtypeStr, out var parsedNum))
                        //        {
                        //            qTypeNumeric = parsedNum;
                        //            if (Enum.IsDefined(typeof(StudyHub.Backend.Domain.Entities.Exam.QuestionType), parsedNum))
                        //                qEnum = (StudyHub.Backend.Domain.Entities.Exam.QuestionType)parsedNum;
                        //        }
                        //        else if (Enum.TryParse<StudyHub.Backend.Domain.Entities.Exam.QuestionType>(qtypeStr, true, out var parsedEnum))
                        //        {
                        //            qEnum = parsedEnum;
                        //            qTypeNumeric = (int)parsedEnum;
                        //        }
                        //        else
                        //        {
                        //            var tnorm = qtypeStr.Trim().ToLowerInvariant();
                        //            if (tnorm.Contains("single")) qEnum = StudyHub.Backend.Domain.Entities.Exam.QuestionType.SingleChoice;
                        //            else if (tnorm.Contains("multiple")) qEnum = StudyHub.Backend.Domain.Entities.Exam.QuestionType.MultipleChoice;
                        //            else if (tnorm.Contains("text") || tnorm.Contains("input")) qEnum = StudyHub.Backend.Domain.Entities.Exam.QuestionType.TextInput;
                        //            else if (tnorm.Contains("fill")) qEnum = StudyHub.Backend.Domain.Entities.Exam.QuestionType.FillBlank;
                        //            else if (tnorm.Contains("match")) qEnum = StudyHub.Backend.Domain.Entities.Exam.QuestionType.Matching;
                        //            if (qEnum.HasValue) qTypeNumeric = (int)qEnum.Value;
                        //        }
                        //    }
                        //}

                        //q.QuestionType = qTypeNumeric;

                        // Common: read options if present
                        if (item.TryGetProperty("options", out var opts) && opts.ValueKind == JsonValueKind.Array)
                        {
                            q.Options = opts.EnumerateArray().Where(x => x.ValueKind == JsonValueKind.String).Select(x => x.GetString() ?? string.Empty).ToList();
                        }

                        switch (qType)
                        {
                            case StudyHub.Backend.Domain.Entities.Exam.QuestionType.SingleChoice:
                                // correctAnswer may be index (number) or a string matching option
                                if (item.TryGetProperty("correctAnswer", out var ca))
                                {
                                    if (ca.ValueKind == JsonValueKind.Number)
                                    {
                                        if (ca.TryGetInt32(out var idx)) q.CorrectAnswerIndex = idx;
                                    }
                                    else if (ca.ValueKind == JsonValueKind.String && q.Options != null)
                                    {
                                        var sval = ca.GetString() ?? string.Empty;
                                        var idx = q.Options.FindIndex(o => string.Equals(o, sval, StringComparison.OrdinalIgnoreCase));
                                        if (idx >= 0) q.CorrectAnswerIndex = idx;
                                    }
                                }
                                break;
                            case StudyHub.Backend.Domain.Entities.Exam.QuestionType.MultipleChoice:
                                // correctAnswer may be array of numbers or strings
                                if (item.TryGetProperty("correctAnswer", out var mca))
                                {
                                    var list = new List<int>();
                                    if (mca.ValueKind == JsonValueKind.Array)
                                    {
                                        foreach (var e in mca.EnumerateArray())
                                        {
                                            if (e.ValueKind == JsonValueKind.Number && e.TryGetInt32(out var i)) list.Add(i);
                                            else if (e.ValueKind == JsonValueKind.String && q.Options != null)
                                            {
                                                var s = e.GetString() ?? string.Empty;
                                                var idx = q.Options.FindIndex(o => string.Equals(o, s, StringComparison.OrdinalIgnoreCase));
                                                if (idx >= 0) list.Add(idx);
                                            }
                                        }
                                    }
                                    else if (mca.ValueKind == JsonValueKind.Number && mca.TryGetInt32(out var singleIdx))
                                    {
                                        list.Add(singleIdx);
                                    }
                                    q.CorrectAnswerIndexes = list.Distinct().ToList();
                                }
                                break;
                            case StudyHub.Backend.Domain.Entities.Exam.QuestionType.TextInput:
                                if (item.TryGetProperty("correctAnswer", out var tca) && tca.ValueKind == JsonValueKind.String)
                                    q.CorrectAnswerText = tca.GetString();
                                break;
                            case StudyHub.Backend.Domain.Entities.Exam.QuestionType.FillBlank:
                                if (item.TryGetProperty("correctAnswer", out var fca))
                                {
                                    if (fca.ValueKind == JsonValueKind.Array)
                                    {
                                        q.CorrectAnswers = fca.EnumerateArray().Where(x => x.ValueKind == JsonValueKind.String).Select(x => x.GetString() ?? string.Empty).ToList();
                                    }
                                    else if (fca.ValueKind == JsonValueKind.String)
                                    {
                                        q.CorrectAnswers = new List<string> { fca.GetString() ?? string.Empty };
                                    }
                                }
                                break;
                            case StudyHub.Backend.Domain.Entities.Exam.QuestionType.Matching:
                                // terms & definitions + mapping
                                if (item.TryGetProperty("terms", out var terms) && terms.ValueKind == JsonValueKind.Array)
                                {
                                    q.Terms = terms.EnumerateArray().Where(x => x.ValueKind == JsonValueKind.String).Select(x => x.GetString() ?? string.Empty).ToList();
                                }
                                if (item.TryGetProperty("definitions", out var defs) && defs.ValueKind == JsonValueKind.Array)
                                {
                                    q.Definitions = defs.EnumerateArray().Where(x => x.ValueKind == JsonValueKind.String).Select(x => x.GetString() ?? string.Empty).ToList();
                                }
                                // mapping may come as object {"0":1,...} or array of pairs
                                if (item.TryGetProperty("correctAnswer", out var map) && map.ValueKind == JsonValueKind.Object)
                                {
                                    var dict = new Dictionary<int, int>();
                                    foreach (var p in map.EnumerateObject())
                                    {
                                        if (int.TryParse(p.Name, out var left) && p.Value.ValueKind == JsonValueKind.Number && p.Value.TryGetInt32(out var right))
                                        {
                                            dict[left] = right;
                                        }
                                    }
                                    q.CorrectAnswerMap = dict;
                                }
                                break;
                            default:
                                // try a best-effort extraction: look for 'correctAnswer' generic
                                if (item.TryGetProperty("correctAnswer", out var gca))
                                {
                                    if (gca.ValueKind == JsonValueKind.Number && gca.TryGetInt32(out var gi)) q.CorrectAnswerIndex = gi;
                                    else if (gca.ValueKind == JsonValueKind.String) q.CorrectAnswerText = gca.GetString();
                                }
                                break;
                        }

                        result.Add(q);
                    }
                    catch
                    {
                        // skip malformed item
                    }
                }
            }
            catch
            {
                // ignore parse errors
            }

            return result;
        }

        // PROMPT TEMPLATE 1: Tạo User Preference Profile 
        private string GetProfileExtractionPrompt(string userMessage)
        {
            return $@"Bạn là một AI assistant chuyên phân tích nhu cầu học tập của học sinh.

                    NHIỆM VỤ: Phân tích câu hỏi của user và tạo ra một User Preference Profile dạng JSON.

                    NGUYÊN TẮC:
                    - Phân tích kỹ từng chi tiết trong câu hỏi
                    - Suy luận thông tin ngầm định (ví dụ: ""thi vào 10"" → grade = 9)
                    - Nếu thiếu thông tin, dùng giá trị mặc định hợp lý
                    - Trả về ĐÚNG format JSON, không giải thích thêm

                    FORMAT OUTPUT (BẮT BUỘC):
                    {{
                      ""subject"": [""Toán học""],
                      ""courseLevel"": ""beginner"",
                      ""documentLevel"": ""easy"",
                      ""goal"": ""thi vào 10"",
                      ""preferredLength"": ""medium"",
                      ""grade"": 9,
                      ""topicKeywords"": [""phương trình"", ""đại số""]
                    }}
                    ```

                    GIẢI THÍCH CÁC TRƯỜNG:
                    - subject: Môn học (array) - VD: [""Toán học"", ""Vật lý""]
                    - courseLevel: ""beginner"" | ""intermediate"" | ""advanced""
                    - documentLevel: ""easy"" | ""medium"" | ""hard""
                    - goal: Mục tiêu học tập - VD: ""thi vào 10"", ""củng cố kiến thức"", ""luyện đề""
                    - preferredLength: ""short"" | ""medium"" | ""long""
                    - grade: Lớp học (6-12)
                    - topicKeywords: Các chủ đề cụ thể (array) - VD: [""phương trình"", ""hình học""]

                    CÂU HỎI CỦA USER:
                    {userMessage}

                    HÃY TRẢ VỀ JSON (không markdown, không giải thích):";
        }
        private string GetCourseExplanationPrompt(
        UserPreferenceProfile profile,
        List<CourseRecommendationResult> recommendations)
        {
            var profileJson = JsonSerializer.Serialize(profile, new JsonSerializerOptions
            {
                WriteIndented = true,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            });

            var coursesInfo = string.Join("\n", recommendations.Select((r, i) =>
                $"{i + 1}. {r.Title} (Điểm: {r.Score:F2})"));

            return $@"Bạn là một AI assistant thân thiện, giúp học sinh hiểu tại sao các khóa học được đề xuất.

                    NHIỆM VỤ: Giải thích tại sao các khóa học dưới đây phù hợp với nhu cầu của học sinh và chỉ trả lời bằng Tiếng Việt.

                    NGUYÊN TẮC:
                    - Giải thích ngắn gọn, dễ hiểu (2-3 câu mỗi khóa)
                    - Liên kết trực tiếp giữa nhu cầu của học sinh và đặc điểm khóa học
                    - Tập trung vào điểm mạnh của từng khóa
                    - Tạo động lực học tập
                    - Sử dụng tone thân thiện, tích cực

                    HỒ SƠ NHU CẦU CỦA HỌC SINH:
                    {profileJson}

                    CÁC KHÓA HỌC ĐỀ XUẤT:
                    {coursesInfo}

                    HÃY GIẢI THÍCH (format: đoạn văn dễ đọc, có đánh số thứ tự):";
        }
        private string GetDocumentExplanationPrompt(
        UserPreferenceProfile profile,
        List<DocumentRecommendationResult> recommendations)
        {
            var profileJson = JsonSerializer.Serialize(profile, new JsonSerializerOptions
            {
                WriteIndented = true,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            });

            var coursesInfo = string.Join("\n", recommendations.Select((r, i) =>
                $"{i + 1}. {r.Title} (Điểm: {r.Score:F2})"));

            return $@"Bạn là một AI assistant thân thiện, giúp học sinh hiểu tại sao các tài liệu được đề xuất.

                    NHIỆM VỤ: Giải thích tại sao các tài liệu dưới đây phù hợp với nhu cầu của học sinh và chỉ trả lời bằng Tiếng Việt.

                    NGUYÊN TẮC:
                    - Giải thích ngắn gọn, dễ hiểu (2-3 câu mỗi tài liệu)
                    - Liên kết trực tiếp giữa nhu cầu của học sinh và đặc điểm tài liệu
                    - Tập trung vào điểm mạnh của từng tài liệu
                    - Tạo động lực học tập
                    - Sử dụng tone thân thiện, tích cực

                    HỒ SƠ NHU CẦU CỦA HỌC SINH:
                    {profileJson}

                    CÁC TÀI LIỆU ĐỀ XUẤT:
                    {coursesInfo}

                    HÃY GIẢI THÍCH (format: đoạn văn dễ đọc, có đánh số thứ tự):";
        }

        public async Task<(UserPreferenceProfile profile, int totalPromptTokens, int totalCompletionTokens)> ExtractProfileAsync(string userMessage)
        {
            var model = (configuration["HuggingFace:LLMModel:Path"] ?? "") + ":" + (configuration["HuggingFace:LLMModel:InferenceProviderPath"] ?? "");
            var apiKey = configuration["HuggingFace:ApiToken"] ?? string.Empty;

            var prompt = GetProfileExtractionPrompt(userMessage);

            var request = new RestRequest();
            request.Method = Method.Post;
            request.AddHeader("Authorization", $"Bearer {apiKey}");
            request.AddJsonBody(new
            {
                model,
                messages = new[]{
                    new
                    {
                        role = "user",
                        content = prompt
                    }
                },
                //max_new_token = 500,
                temperature = 0.3,
                top_p = 0.95,
                //return_full_text = false
            });

            var response = await _client.ExecuteAsync(request);

            if (!response.IsSuccessful)
            {
                throw new Exception($"LLM API error: {response.Content}");
            }

            var resultJson = response.Content;

            if (string.IsNullOrEmpty(resultJson))
            {
                throw new Exception("LLM API returned empty response.");
            }
            try
            {
                using var doc = JsonDocument.Parse(resultJson);
                var root = doc.RootElement;

                if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var first = choices[0];
                    if (first.TryGetProperty("message", out var message) && message.TryGetProperty("content", out var contentProp))
                    {
                        var raw = contentProp.GetString() ?? string.Empty;
                        raw = raw.Trim();
                        UserPreferenceProfile? profile = null;
                        try
                        {
                            profile = JsonSerializer.Deserialize<UserPreferenceProfile>(raw, new JsonSerializerOptions
                            {
                                PropertyNameCaseInsensitive = true
                            });
                        }
                        catch
                        {
                            profile = null;
                        }

                        int promptTokens = 0;
                        int completionTokens = 0;
                        if (root.TryGetProperty("usage", out var usage))
                        {
                            if (usage.TryGetProperty("prompt_tokens", out var promptTok) && promptTok.ValueKind == JsonValueKind.Number)
                                promptTokens = promptTok.GetInt32();
                            if (usage.TryGetProperty("completion_tokens", out var compTok) && compTok.ValueKind == JsonValueKind.Number)
                                completionTokens = compTok.GetInt32();
                        }

                        return (profile ?? new UserPreferenceProfile(), promptTokens, completionTokens);
                    }
                }
            }
            catch
            {
                // Ignore parse errors and fall through to default
            }

            return (new UserPreferenceProfile(), 0, 0);
        }

        // Extract Quiz specification (numQuestions, questionType, keywords, subject, grade)
        private string GetQuizSpecExtractionPrompt(string userMessage)
        {
            return $@"Phân tích yêu cầu tạo đề kiểm tra và trả về JSON thuần (không markdown, không giải thích).

                        CẤU TRÚC JSON:
                        {{
                          ""numQuestions"": <số nguyên>,
                          ""questionType"": ""SingleChoice"" | ""MultipleChoice"" | ""TextInput"" | ""FillBlank"" | ""Matching"",
                          ""keywords"": [""từ khóa 1"", ""từ khóa 2""],
                        }}

                        QUY TẮC:
                        - Trường nào không có thông tin → null
                        - questionType: SingleChoice, MultipleChoice, TextInput, FillBlank, Matching
                        - keywords: ""điền nhiều"" và ""điền vào ô trống"" là FillBlank, ""nối"" là Matching, ""nhập"" và ""điền"" là TextInput, ""chọn 1"" là SingleChoice, ""chọn nhiều"" là MultipleChoice 

                        VÍ DỤ:
                        ""5 câu trắc nghiệm thì hiện tại đơn Tiếng Anh lớp 8""
                        → {{""numQuestions"":5,""questionType"":""SingleChoice"",""keywords"":[""present simple"",""thì hiện tại đơn""]}}

                        NỘI DUNG: {userMessage}

                        JSON:";
        }

        public async Task<(StudyHub.Backend.UseCases.Dtos.QuizSpec spec, int promptTokens, int completionTokens)> ExtractQuizSpecAsync(string userMessage)
        {
                var extracted = QuizSpecExtractor.Extract(userMessage ?? string.Empty);

                var hasUseful = (extracted.NumQuestions > 0)
                                && (!string.IsNullOrEmpty(extracted.QuestionType) || !string.IsNullOrWhiteSpace(extracted.QuestionType))
                                && (extracted.Keywords != null && extracted.Keywords.Count > 0);

                if (hasUseful)
                {
                    return (extracted, 0, 0);
                }

            // Fallback: use LLM prompt-based extraction
            var model = (configuration["HuggingFace:LLMModel:Path"] ?? "") + ":" + (configuration["HuggingFace:LLMModel:InferenceProviderPath"] ?? "");
            var apiKey = configuration["HuggingFace:ApiToken"] ?? string.Empty;

            var prompt = GetQuizSpecExtractionPrompt(userMessage ?? "");

            var request = new RestRequest();
            request.Method = Method.Post;
            if (!string.IsNullOrEmpty(apiKey)) request.AddHeader("Authorization", $"Bearer {apiKey}");
            request.AddJsonBody(new
            {
                model,
                messages = new[] { new { role = "user", content = prompt } },
                temperature = 0.2,
                top_p = 0.95
            });

            var response = await _client.ExecuteAsync(request);
            if (!response.IsSuccessful) throw new Exception($"LLM API error: {response.Content}");

            var resultJson = response.Content;
            if (string.IsNullOrEmpty(resultJson)) return (new StudyHub.Backend.UseCases.Dtos.QuizSpec(), 0, 0);

            try
            {
                using var doc = JsonDocument.Parse(resultJson);
                var root = doc.RootElement;

                if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var first = choices[0];
                    if (first.TryGetProperty("message", out var message) && message.TryGetProperty("content", out var contentProp))
                    {
                        var raw = contentProp.GetString() ?? string.Empty;
                        raw = raw.Trim();
                        try
                        {
                            var spec = JsonSerializer.Deserialize<StudyHub.Backend.UseCases.Dtos.QuizSpec>(raw, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                            int promptTokens = 0; int completionTokens = 0;
                            if (root.TryGetProperty("usage", out var usage))
                            {
                                if (usage.TryGetProperty("prompt_tokens", out var p) && p.ValueKind == JsonValueKind.Number) promptTokens = p.GetInt32();
                                if (usage.TryGetProperty("completion_tokens", out var c) && c.ValueKind == JsonValueKind.Number) completionTokens = c.GetInt32();
                            }
                            return (spec ?? new StudyHub.Backend.UseCases.Dtos.QuizSpec(), promptTokens, completionTokens);
                        }
                        catch
                        {
                            return (new StudyHub.Backend.UseCases.Dtos.QuizSpec(), 0, 0);
                        }
                    }
                }
            }
            catch { }

            return (new StudyHub.Backend.UseCases.Dtos.QuizSpec(), 0, 0);
        }



        // Generate new quiz questions given examples and spec. Return parsed questions, raw content and token usage
        public async Task<(List<StudyHub.Backend.UseCases.Dtos.GeneratedQuestionDto> questions, string content, int promptTokens, int completionTokens)> GenerateQuizFromExamplesAsync(StudyHub.Backend.UseCases.Dtos.QuizSpecDto spec, List<StudyHub.Backend.UseCases.Dtos.ExampleQuestionDto> examples)
        {
            var model = (configuration["HuggingFace:LLMModel:Path"] ?? "") + ":" + (configuration["HuggingFace:LLMModel:InferenceProviderPath"] ?? "");
            var apiKey = configuration["HuggingFace:ApiToken"] ?? string.Empty;

            var sb = new System.Text.StringBuilder();
            sb.AppendLine("Bạn là một AI giáo viên tạo câu hỏi kiểm tra dựa trên ví dụ.");
            sb.AppendLine("NHIỆM VỤ: Tạo các câu hỏi mới theo `spec` và ví dụ; giữ nguyên giá trị số và đáp án đúng như trong ví dụ. Trả về MẢNG JSON các object có cấu trúc: {questionText, options (nullable), correctAnswer, questionType}.");
            sb.AppendLine("NGUYÊN TẮC CHUNG:");
            sb.AppendLine("- Không thay đổi giá trị số học, kết quả tính toán hay text chính xác của đáp án đúng (correctAnswer).");
            sb.AppendLine("- Ngôn ngữ đầu ra: Nếu 'subject' trong spec là một ngôn ngữ (ví dụ: 'Tiếng Anh', 'English', 'Tiếng Pháp'), thì cả 'questionText' và 'correctAnswer' phải được viết bằng ngôn ngữ đó. Nếu không rõ, mặc định dùng Tiếng Việt.");
            sb.AppendLine("- Trả về CHÍNH XÁC MẢNG JSON, không giải thích, không markdown.");
            sb.AppendLine();
            sb.AppendLine("YÊU CẦU SPEC:");
            sb.AppendLine(JsonSerializer.Serialize(spec, new JsonSerializerOptions { Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping, Converters = { new JsonStringEnumConverter() } }));
            sb.AppendLine();
            sb.AppendLine("VÍ DỤ (source examples):");
            foreach (var ex in examples)
            {
                sb.AppendLine(JsonSerializer.Serialize(ex, new JsonSerializerOptions { Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));
            }
            sb.AppendLine();

            switch (spec.QuestionType)
            {
                case Domain.Entities.Exam.QuestionType.SingleChoice:
                    sb.AppendLine("HƯỚNG DẪN CHO SingleChoice:");
                    sb.AppendLine("- Tạo các câu hỏi SingleChoice. Mỗi question object phải có 'questionText', 'options' (mảng 4 items), 'correctAnswer' (một string phải là một trong options) và 'questionType': 0.");
                    sb.AppendLine("- Giữ nguyên text của 'correctAnswer' như trong ví dụ; chỉ thay đổi cách diễn đạt câu hỏi và nội dung các distractors.");
                    break;
                case Domain.Entities.Exam.QuestionType.MultipleChoice:
                    sb.AppendLine("HƯỚNG DẪN CHO MultipleChoice:");
                    sb.AppendLine("- Tạo các câu hỏi MultipleChoice. Mỗi object: 'questionText', 'options' (mảng 4-5 items), 'correctAnswer' (mảng hoặc string JSON chứa các đáp án đúng), 'questionType': 1.");
                    sb.AppendLine("- Giữ nguyên tập đáp án đúng từ ví dụ; nếu ví dụ không có tập, chọn 1 đúng và thêm distractors.");
                    break;
                case Domain.Entities.Exam.QuestionType.TextInput:
                    sb.AppendLine("HƯỚNG DẪN CHO TextInput:");
                    sb.AppendLine("- Tạo các câu hỏi TextInput. Mỗi object: 'questionText', 'correctAnswer' (string), 'questionType': 2. Không thêm 'options'.");
                    break;
                case Domain.Entities.Exam.QuestionType.FillBlank:
                    sb.AppendLine("HƯỚNG DẪN CHO FillBlank:");
                    sb.AppendLine("- Tạo các câu FillBlank. 'questionText' phải chứa một hoặc nhiều chỗ trống '___' biểu diễn blank; 'correctAnswer' giữ một hoặc nhiều giá trị điền vào tuỳ vào thứ tự ô trống; 'questionType': 3.");
                    break;
                case Domain.Entities.Exam.QuestionType.Matching:
                    sb.AppendLine("HƯỚNG DẪN CHO Matching:");
                    sb.AppendLine("- Tạo các câu Matching.");
                    sb.AppendLine("- Mỗi object PHẢI có các trường: 'questionText' (string), 'terms' (array các mục bên trái), 'definitions' (array các mục bên phải), 'correctAnswer' (object mapping các index trái -> index phải), 'questionType': 4.");
                    sb.AppendLine("- 'terms' và 'definitions' phải là mảng string có cùng độ dài; index bắt đầu từ 0.");
                    sb.AppendLine("- 'correctAnswer' phải là object với key là index bên trái (string hoặc number) và value là index bên phải (number). Ví dụ: {\"0\":1, \"1\":0}.");
                    sb.AppendLine("- 'options' có thể để trống hoặc bỏ qua; không dùng 'options' để thay thế cho 'terms'/'definitions'.");
                    sb.AppendLine("- Trả về 'questionType': 4 (số nguyên) để tương thích với schema lưu trữ.");
                    break;
                default:
                    sb.AppendLine("HƯỚNG DẪN CHUNG (nếu questionType không xác định):");
                    sb.AppendLine("- Sinh SingleChoice theo mặc định với cấu trúc: questionText, options (4), correctAnswer, questionType='SingleChoice'.");
                    break;
            }

            sb.AppendLine();
            sb.AppendLine($"HÃY TRẢ VỀ 1 MẢNG JSON CHỨA {(spec.NumQuestions > 0 ? spec.NumQuestions : 5)} CÂU HỎI MỚI THEO QUI TẮC TRÊN.");
            sb.AppendLine("CHỈ TRẢ VỀ MẢNG JSON, KHÔNG CÓ TEXT KHÁC, KHÔNG CÓ ```json, SỬ DỤNG KÝ TỰ UTF-8 TRỰC TIẾP.");

            var prompt = sb.ToString();

            var request = new RestRequest();
            request.Method = Method.Post;
            if (!string.IsNullOrEmpty(apiKey)) request.AddHeader("Authorization", $"Bearer {apiKey}");
            request.AddJsonBody(new
            {
                model,
                messages = new[] { new { role = "user", content = prompt } },
                temperature = 0.7,
                top_p = 0.95
            });

            var response = await _client.ExecuteAsync(request);
            if (!response.IsSuccessful) throw new Exception($"LLM API error: {response.Content}");

            var resultJson = response.Content;
            if (string.IsNullOrEmpty(resultJson)) return (new List<StudyHub.Backend.UseCases.Dtos.GeneratedQuestionDto>(), string.Empty, 0, 0);

            try
            {
                using var doc = JsonDocument.Parse(resultJson);
                var root = doc.RootElement;

                string content = string.Empty;
                int promptTokens = 0; int completionTokens = 0;
                var parsedQuestions = new List<StudyHub.Backend.UseCases.Dtos.GeneratedQuestionDto>();

                if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var first = choices[0];
                    if (first.TryGetProperty("message", out var message) && message.TryGetProperty("content", out var contentProp))
                    {
                        content = contentProp.GetString() ?? string.Empty;
                        content = content.Trim();

                        // clean fences and try to extract JSON array substring if needed
                        var cleaned = Regex.Replace(content, "^```\\w*\\n|\\n```$", "", RegexOptions.Multiline).Trim();
                        // attempt to find a JSON array inside the cleaned content
                        var arrayMatch = Regex.Match(cleaned, "\\[.*\\]", RegexOptions.Singleline);
                        if (arrayMatch.Success)
                        {
                            parsedQuestions = ParseGeneratedQuestions(arrayMatch.Value, spec.QuestionType);
                        }
                        else
                        {
                            parsedQuestions = ParseGeneratedQuestions(cleaned, spec.QuestionType);
                        }
                    }
                }

                if (root.TryGetProperty("usage", out var usage))
                {
                    if (usage.TryGetProperty("prompt_tokens", out var p) && p.ValueKind == JsonValueKind.Number) promptTokens = p.GetInt32();
                    if (usage.TryGetProperty("completion_tokens", out var c) && c.ValueKind == JsonValueKind.Number) completionTokens = c.GetInt32();
                }

                return (parsedQuestions, content, promptTokens, completionTokens);
            }
            catch
            {
                return (new List<StudyHub.Backend.UseCases.Dtos.GeneratedQuestionDto>(), resultJson, 0, 0);
            }
        }

        // Generate quiz WITHOUT passing examples. The model should invent or infer suitable examples
        // internally and produce final questions. Output must be an exact JSON array compatible with QuestionMapper.
        public async Task<(List<StudyHub.Backend.UseCases.Dtos.GeneratedQuestionDto> questions, string content, int promptTokens, int completionTokens)> GenerateQuizAsync(StudyHub.Backend.UseCases.Dtos.QuizSpecDto spec)
        {
            var model = (configuration["HuggingFace:LLMModel:Path"] ?? "") + ":" + (configuration["HuggingFace:LLMModel:InferenceProviderPath"] ?? "");
            var apiKey = configuration["HuggingFace:ApiToken"] ?? string.Empty;

            var sb = new System.Text.StringBuilder();
            sb.AppendLine("Bạn là một AI giáo viên tạo câu hỏi kiểm tra dựa trên spec được cung cấp.");
            sb.AppendLine("NHIỆM VỤ: Từ `spec` tự sinh (hoặc suy luận) ví dụ nguồn nếu cần, sau đó tạo danh sách câu hỏi phù hợp. Chỉ trả về MẢNG JSON cuối cùng.");
            sb.AppendLine("QUY TẮC CHUNG:");
            sb.AppendLine("- Trả về CHÍNH XÁC MẢNG JSON duy nhất, KHÔNG có text khác, không markdown, không code fences.");
            sb.AppendLine("- TUYỆT ĐỐI KHÔNG sử dụng ký hiệu LaTeX như \\(, \\), \\[, \\]. Viết công thức dưới dạng text thuần (ví dụ: f(x) = x^2 + 3x - 5).");
            sb.AppendLine("- Sử dụng UTF-8, không escape unicode.");
            sb.AppendLine("- Không thêm trường thừa.");
            sb.AppendLine();
            sb.AppendLine("YÊU CẦU SPEC:");
            sb.AppendLine(JsonSerializer.Serialize(spec, new JsonSerializerOptions { Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping, Converters = { new JsonStringEnumConverter() } }));
            sb.AppendLine();
            // Per-question-type detailed guidance (mirrors GenerateQuizFromExamplesAsync style)
            switch (spec.QuestionType)
            {
                case Domain.Entities.Exam.QuestionType.SingleChoice:
                    sb.AppendLine("HƯỚNG DẪN CHO SingleChoice:");
                    sb.AppendLine("- Tạo các câu hỏi SingleChoice. Mỗi object phải có 'questionText' (string), 'options' (mảng 4 mục), 'correctAnswer' (số nguyên index bắt đầu từ 0 tương ứng vị trí trong 'options')");
                    sb.AppendLine("- 'correctAnswer' phải là index (number) chỉ vào vị trí đúng trong 'options'.");
                    sb.AppendLine("- Giữ nguyên mọi giá trị số và text chính xác; distractors (các lựa chọn sai) phải hợp lý và đồng cấp về độ dài.");
                    sb.AppendLine("- VÍ DỤ OUTPUT (1 object): {\"questionText\": \"Which planet is known as the Red Planet?\", \"options\": [\"Earth\", \"Mars\", \"Venus\", \"Jupiter\"], \"correctAnswer\": 1}");
                    break;
                case Domain.Entities.Exam.QuestionType.MultipleChoice:
                    sb.AppendLine("HƯỚNG DẪN CHO MultipleChoice:");
                    sb.AppendLine("- Tạo các câu MultipleChoice. Mỗi object phải có 'questionText', 'options' (mảng 4-5 mục), 'correctAnswer' (mảng số nguyên index bắt đầu từ 0).");
                    sb.AppendLine("- 'correctAnswer' phải là mảng index (ví dụ: [0,2]) chỉ ra các options đúng.");
                    sb.AppendLine("- Nếu ví dụ gốc có nhiều đáp án đúng, bảo toàn tập đáp án; nếu không, chọn 1-2 đáp án hợp lý.");
                    sb.AppendLine("- VÍ DỤ OUTPUT (1 object): {\"questionText\": \"Select the prime numbers:\", \"options\": [\"4\", \"7\", \"9\", \"11\"], \"correctAnswer\": [1,3]}");
                    break;
                case Domain.Entities.Exam.QuestionType.TextInput:
                    sb.AppendLine("HƯỚNG DẪN CHO TextInput:");
                    sb.AppendLine("- Tạo các câu TextInput. Mỗi object phải có 'questionText' và 'correctAnswer' (string), 'questionType': 2. Không có 'options'.");
                    sb.AppendLine("- Đảm bảo 'correctAnswer' là text chính xác (giữ nguyên ký tự, chữ hoa/thường nếu cần thiết).");
                    sb.AppendLine("- VÍ DỤ OUTPUT (1 object): {\"questionText\": \"Translate to English: 'Con mèo đang ngủ'.\", \"correctAnswer\": \"The cat is sleeping\"}");
                    break;
                case Domain.Entities.Exam.QuestionType.FillBlank:
                    sb.AppendLine("HƯỚNG DẪN CHO FillBlank:");
                    sb.AppendLine("- Tạo các câu FillBlank. 'questionText' phải chứa chỗ trống biểu diễn bằng '[BLANK]' cho mỗi đáp án; 'correctAnswer' là mảng string chứa các đáp án theo thứ tự xuất hiện.");
                    sb.AppendLine("- Nếu có nhiều blank, trả về một mảng 'correctAnswer' tương ứng theo thứ tự.");
                    sb.AppendLine("- VÍ DỤ OUTPUT (1 object): {\"questionText\": \"The capital of France is [BLANK] .\", \"correctAnswer\": [\"Paris\"]}");
                    break;
                case Domain.Entities.Exam.QuestionType.Matching:
                    sb.AppendLine("HƯỚNG DẪN CHO Matching:");
                    sb.AppendLine("- Tạo các câu Matching.");
                    sb.AppendLine("- Mỗi object PHẢI có: 'questionText' (string), 'terms' (array left items), 'definitions' (array right items), 'correctAnswer' (object mapping leftIndex->rightIndex).");
                    sb.AppendLine("- Đảm bảo 'terms' và 'definitions' có cùng độ dài. Index bắt đầu từ 0.");
                    sb.AppendLine("- 'correctAnswer' phải là object JSON với key là index bên trái (ví dụ \"0\"), value là index bên phải (number). Ví dụ: {\"0\":0, \"1\":1}.");
                    sb.AppendLine("- 'options' có thể để trống hoặc bỏ qua; không dùng 'options' để thay thế cho 'terms'/'definitions'.");
                    sb.AppendLine("- Trả về 'questionType': 4 để tương thích với schema lưu trữ.");
                    sb.AppendLine("- VÍ DỤ OUTPUT (1 object): {\"questionText\": \"Nối nhân vật với đặc điểm tương ứng:\", \"terms\": [\"Từ Hải\", \"Hoạn Thư\"], \"definitions\": [\"Chí khí anh hùng\", \"Ghen tuông sắc sảo\"], \"correctAnswer\": {\"0\":0, \"1\":1}}");
                    break;
                default:
                    sb.AppendLine("HƯỚNG DẪN CHUNG (nếu questionType không xác định):");
                    sb.AppendLine("- Sinh SingleChoice theo mặc định với cấu trúc: questionText, options (4), correctAnswer (index).");
                    break;
            }
            sb.AppendLine();
            //sb.AppendLine("ADDITIONAL RULES:");
            //sb.AppendLine("- Preserve any numeric values and exact textual answers when present.");
            //sb.AppendLine("- For choice questions, ensure 'correctAnswer' indexes correctly point to the options array.");
            //sb.AppendLine();
            sb.AppendLine($"HÃY TRẢ VỀ 1 MẢNG JSON CHỨA {(spec.NumQuestions > 0 ? spec.NumQuestions : 5)} CÂU HỎI MỚI THEO QUI TẮC TRÊN.");

            var prompt = sb.ToString();

            var request = new RestRequest();
            request.Method = Method.Post;
            if (!string.IsNullOrEmpty(apiKey)) request.AddHeader("Authorization", $"Bearer {apiKey}");
            request.AddJsonBody(new
            {
                model,
                messages = new[] { new { role = "user", content = prompt } },
                temperature = 0.7,
                top_p = 0.95
            });

            var response = await _client.ExecuteAsync(request);
            if (!response.IsSuccessful) throw new Exception($"LLM API error: {response.Content}");

            var resultJson = response.Content;
            if (string.IsNullOrEmpty(resultJson)) return (new List<StudyHub.Backend.UseCases.Dtos.GeneratedQuestionDto>(), string.Empty, 0, 0);

            try
            {
                using var doc = JsonDocument.Parse(resultJson);
                var root = doc.RootElement;

                string content = string.Empty;
                int promptTokens = 0; int completionTokens = 0;
                var parsedQuestions = new List<StudyHub.Backend.UseCases.Dtos.GeneratedQuestionDto>();

                if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var first = choices[0];
                    if (first.TryGetProperty("message", out var message) && message.TryGetProperty("content", out var contentProp))
                    {
                        content = contentProp.GetString() ?? string.Empty;
                        content = content.Trim();

                        // clean fences
                        var cleaned = Regex.Replace(content, "^```(json)?\\s*|\\s*```$", "", RegexOptions.Multiline).Trim();

                        // Bỏ \(...\) → (...)
                        cleaned = Regex.Replace(cleaned, @"\\\((.*?)\\\)", "($1)");

                        // Nếu có \[ ... \] thì xử luôn
                        cleaned = Regex.Replace(cleaned, @"\\\[(.*?)\\\]", "[$1]");

                        // Nếu có \[ ... \] thì xử luôn
                        cleaned = Regex.Replace(cleaned, @"\\\{(.*?)\\\}", "{$1}");
                        parsedQuestions = ParseGeneratedQuestions(cleaned, spec.QuestionType);
                    }
                }

                if (root.TryGetProperty("usage", out var usage))
                {
                    if (usage.TryGetProperty("prompt_tokens", out var p) && p.ValueKind == JsonValueKind.Number) promptTokens = p.GetInt32();
                    if (usage.TryGetProperty("completion_tokens", out var c) && c.ValueKind == JsonValueKind.Number) completionTokens = c.GetInt32();
                }

                return (parsedQuestions, content, promptTokens, completionTokens);
            }
            catch
            {
                return (new List<StudyHub.Backend.UseCases.Dtos.GeneratedQuestionDto>(), resultJson, 0, 0);
            }
        }

        // New: return both content and token usage
        public async Task<(string content, int promptTokens, int completionTokens)> GenerateCourseExplanationWithUsageAsync(
            UserPreferenceProfile profile,
            List<CourseRecommendationResult> recommendations)
        {
            var model = (configuration["HuggingFace:LLMModel:Path"] ?? "") + ":" + (configuration["HuggingFace:LLMModel:InferenceProviderPath"] ?? "");
            var apiKey = configuration["HuggingFace:ApiToken"] ?? string.Empty;

            var prompt = GetCourseExplanationPrompt(profile, recommendations);

            var request = new RestRequest();
            request.Method = Method.Post;
            if (!string.IsNullOrEmpty(apiKey)) request.AddHeader("Authorization", $"Bearer {apiKey}");
            request.AddJsonBody(new
            {
                model,
                messages = new[]{
                    new
                    {
                        role = "user",
                        content = prompt
                    }
                },
                temperature = 0.7,
                top_p = 0.95,
            });

            var response = await _client.ExecuteAsync(request);

            if (!response.IsSuccessful)
            {
                throw new Exception($"LLM API error: {response.Content}");
            }

            var resultJson = response.Content;
            if (string.IsNullOrEmpty(resultJson)) throw new Exception("LLM API returned empty response.");

            try
            {
                using var doc = JsonDocument.Parse(resultJson);
                var root = doc.RootElement;

                string content = string.Empty;
                int promptTokens = 0;
                int completionTokens = 0;

                if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var first = choices[0];
                    if (first.TryGetProperty("message", out var message) && message.TryGetProperty("content", out var contentProp))
                    {
                        content = contentProp.GetString() ?? string.Empty;
                        content = content.Trim();
                    }
                }

                if (root.TryGetProperty("usage", out var usage))
                {
                    if (usage.TryGetProperty("prompt_tokens", out var promptTok) && promptTok.ValueKind == JsonValueKind.Number)
                        promptTokens = promptTok.GetInt32();
                    if (usage.TryGetProperty("completion_tokens", out var compTok) && compTok.ValueKind == JsonValueKind.Number)
                        completionTokens = compTok.GetInt32();
                }

                return (content, promptTokens, completionTokens);
            }
            catch
            {
                return (string.Empty, 0, 0);
            }
        }

        // Backwards-compatible wrapper that returns only the content
        public async Task<string> GenerateCourseExplanationAsync(
            UserPreferenceProfile profile,
            List<CourseRecommendationResult> recommendations)
        {
            var res = await GenerateCourseExplanationWithUsageAsync(profile, recommendations);
            return res.content;
        }

        public async Task<(string content, int promptTokens, int completionTokens)> GenerateDocumentExplanationWithUsageAsync(
            UserPreferenceProfile profile,
            List<DocumentRecommendationResult> recommendations)
        {
            var model = (configuration["HuggingFace:LLMModel:Path"] ?? "") + ":" + (configuration["HuggingFace:LLMModel:InferenceProviderPath"] ?? "");
            var apiKey = configuration["HuggingFace:ApiToken"] ?? string.Empty;

            var prompt = GetDocumentExplanationPrompt(profile, recommendations);

            var request = new RestRequest();
            request.Method = Method.Post;
            if (!string.IsNullOrEmpty(apiKey)) request.AddHeader("Authorization", $"Bearer {apiKey}");
            request.AddJsonBody(new
            {
                model,
                messages = new[]{
                    new
                    {
                        role = "user",
                        content = prompt
                    }
                },
                temperature = 0.7,
                top_p = 0.95,
            });

            var response = await _client.ExecuteAsync(request);

            if (!response.IsSuccessful)
            {
                throw new Exception($"LLM API error: {response.Content}");
            }

            var resultJson = response.Content;
            if (string.IsNullOrEmpty(resultJson)) throw new Exception("LLM API returned empty response.");

            try
            {
                using var doc = JsonDocument.Parse(resultJson);
                var root = doc.RootElement;

                string content = string.Empty;
                int promptTokens = 0;
                int completionTokens = 0;

                if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var first = choices[0];
                    if (first.TryGetProperty("message", out var message) && message.TryGetProperty("content", out var contentProp))
                    {
                        content = contentProp.GetString() ?? string.Empty;
                        content = content.Trim();
                    }
                }

                if (root.TryGetProperty("usage", out var usage))
                {
                    if (usage.TryGetProperty("prompt_tokens", out var promptTok) && promptTok.ValueKind == JsonValueKind.Number)
                        promptTokens = promptTok.GetInt32();
                    if (usage.TryGetProperty("completion_tokens", out var compTok) && compTok.ValueKind == JsonValueKind.Number)
                        completionTokens = compTok.GetInt32();
                }

                return (content, promptTokens, completionTokens);
            }
            catch
            {
                return (string.Empty, 0, 0);
            }
        }
        public async Task<(string content, int promptTokens, int completionTokens)> GenerateResponseAsync(string prompt)
        {
            var model = (configuration["HuggingFace:LLMModel:Path"] ?? "") + ":" + (configuration["HuggingFace:LLMModel:InferenceProviderPath"] ?? "");
            var apiKey = configuration["HuggingFace:ApiToken"] ?? string.Empty;

            var request = new RestRequest();
            request.Method = Method.Post;
            if (!string.IsNullOrEmpty(apiKey)) request.AddHeader("Authorization", $"Bearer {apiKey}");
            request.AddJsonBody(new
            {
                model,
                messages = new[]{
            new
            {
                role = "user",
                content = prompt
            }
        },
                temperature = 0.7,
                top_p = 0.95,
            });

            var response = await _client.ExecuteAsync(request);

            if (!response.IsSuccessful)
            {
                throw new Exception($"LLM API error: {response.Content}");
            }

            var resultJson = response.Content;
            if (string.IsNullOrEmpty(resultJson)) throw new Exception("LLM API returned empty response.");

            try
            {
                using var doc = JsonDocument.Parse(resultJson);
                var root = doc.RootElement;

                string content = string.Empty;
                int promptTokens = 0;
                int completionTokens = 0;

                if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var first = choices[0];
                    if (first.TryGetProperty("message", out var message) && message.TryGetProperty("content", out var contentProp))
                    {
                        content = contentProp.GetString() ?? string.Empty;
                        content = content.Trim();
                    }
                }

                if (root.TryGetProperty("usage", out var usage))
                {
                    if (usage.TryGetProperty("prompt_tokens", out var promptTok) && promptTok.ValueKind == JsonValueKind.Number)
                        promptTokens = promptTok.GetInt32();
                    if (usage.TryGetProperty("completion_tokens", out var compTok) && compTok.ValueKind == JsonValueKind.Number)
                        completionTokens = compTok.GetInt32();
                }

                return (content, promptTokens, completionTokens);
            }
            catch
            {
                return (string.Empty, 0, 0);
            }
        }

        // Backwards-compatible wrapper that returns only the content
        public async Task<string> GenerateDocumentExplanationAsync(
            UserPreferenceProfile profile,
            List<DocumentRecommendationResult> recommendations)
        {
            var res = await GenerateDocumentExplanationWithUsageAsync(profile, recommendations);
            return res.content;
        }
    }
}
