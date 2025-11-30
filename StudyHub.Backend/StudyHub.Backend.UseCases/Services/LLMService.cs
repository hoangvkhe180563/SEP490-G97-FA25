using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using RestSharp;
using StudyHub.Backend.UseCases.Dtos;

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
