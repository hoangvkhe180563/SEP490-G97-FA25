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
    public class QwenLLMService
    {
        private readonly RestClient _client;
        private readonly IConfiguration configuration;

        public QwenLLMService(IConfiguration configuration)
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
                      ""level"": ""beginner"",
                      ""goal"": ""thi vào 10"",
                      ""preferredLength"": ""medium"",
                      ""grade"": 9,
                      ""topicKeywords"": [""phương trình"", ""đại số""]
                    }}
                    ```

                    GIẢI THÍCH CÁC TRƯỜNG:
                    - subject: Môn học (array) - VD: [""Toán học"", ""Vật lý""]
                    - level: ""beginner"" | ""intermediate"" | ""advanced""
                    - goal: Mục tiêu học tập - VD: ""thi vào 10"", ""củng cố kiến thức"", ""luyện đề""
                    - preferredLength: ""short"" | ""medium"" | ""long""
                    - grade: Lớp học (6-12)
                    - topicKeywords: Các chủ đề cụ thể (array) - VD: [""phương trình"", ""hình học""]

                    CÂU HỎI CỦA USER:
                    {userMessage}

                    HÃY TRẢ VỀ JSON (không markdown, không giải thích):";
        }

        // PROMPT TEMPLATE 2: Tạo Explanation cho recommendations
        private string GetExplanationPrompt(
        UserPreferenceProfile profile,
        List<RecommendationResult> recommendations)
        {
            var profileJson = JsonSerializer.Serialize(profile, new JsonSerializerOptions
            {
                WriteIndented = true,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            });

            var coursesInfo = string.Join("\n", recommendations.Select((r, i) =>
                $"{i + 1}. {r.Title} (Điểm: {r.Score:F2})"));

            return $@"Bạn là một AI assistant thân thiện, giúp học sinh hiểu tại sao các khóa học được đề xuất.

                    NHIỆM VỤ: Giải thích tại sao các khóa học dưới đây phù hợp với nhu cầu của học sinh.

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

        public async Task<UserPreferenceProfile> ExtractProfileAsync(string userMessage)
        {
            var model = configuration["HuggingFace:LLMModel"] ?? "Qwen/Qwen3-4B-Instruct-2507";
            var apiKey = configuration["HuggingFace:ApiToken"] ?? "";

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
                max_new_token = 500,
                temperature = 0.3,
                top_p = 0.95,
                return_full_text = false
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
            var doc = JsonDocument.Parse(resultJson);
            var choices = doc.RootElement.GetProperty("choices");
            if (choices.GetArrayLength() > 0)
            {
                var message = choices[0].GetProperty("message");
                if (message.TryGetProperty("content", out var contentProp))
                {
                    var raw = contentProp.GetString() ?? "";
                    raw = raw.Trim();
                    var profile = JsonSerializer.Deserialize<UserPreferenceProfile>(raw, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    return profile ?? new UserPreferenceProfile();
                }
            }

            return new UserPreferenceProfile();
        }

        public async Task<string> GenerateExplanationAsync(
        UserPreferenceProfile profile,
        List<RecommendationResult> recommendations)
        {

            var model = configuration["HuggingFace:LLMModel"] ?? "Qwen/Qwen3-4B-Instruct-2507";
            var apiKey = configuration["HuggingFace:ApiToken"] ?? "";

            var prompt = GetExplanationPrompt(profile, recommendations);

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
                max_new_tokens = 800,
                temperature = 0.7,
                top_p = 0.95,
                return_full_text = false
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
            var doc = JsonDocument.Parse(resultJson);
            var choices = doc.RootElement.GetProperty("choices");
            if (choices.GetArrayLength() > 0)
            {
                var message = choices[0].GetProperty("message");
                if (message.TryGetProperty("content", out var contentProp))
                {
                    var raw = contentProp.GetString() ?? "";
                    raw = raw.Trim();
                    return raw;
                }
            }

            return "";
        }
    }
}
