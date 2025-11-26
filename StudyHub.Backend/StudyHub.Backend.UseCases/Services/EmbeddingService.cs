using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using RestSharp;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Domain.Entities.ElasticSearch;
using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.UseCases.Services
{
    public class EmbeddingService
    {
        private readonly RestClient _client;
        private readonly IConfiguration configuration;

        public EmbeddingService(IConfiguration configuration)
        {
            this.configuration = configuration;
            _client = new RestClient("https://router.huggingface.co/hf-inference");
        }

        public async Task<float[]> GetEmbeddingAsync(string text)
        {

            var model = configuration["HuggingFace:EmbeddingModel"] ?? "intfloat/multilingual-e5-large";
            var apiKey = configuration["HuggingFace:ApiToken"] ?? "";

            var request = new RestRequest($"/models/{model}/pipeline/feature-extraction", Method.Post);
            request.AddHeader("Authorization", $"Bearer {apiKey}");
            request.AddJsonBody(new { inputs = text, model, provider = "hf-inference" });

            var response = await _client.ExecuteAsync(request);

            if (!response.IsSuccessful)
            {
                throw new Exception($"Embedding API error: {response.Content}");
            }

            var embeddings = JsonSerializer.Deserialize<float[]>(response.Content);
            return embeddings;
        }

        public async Task<float[][]> GetEmbeddingsBatchAsync(List<string> texts)
        {
            var model = configuration["HuggingFace:EmbeddingModel"] ?? "intfloat/multilingual-e5-large";
            var apiKey = configuration["HuggingFace:ApiToken"] ?? "";

            var request = new RestRequest($"/models/{model}/pipeline/feature-extraction", Method.Post);
            request.AddHeader("Authorization", $"Bearer {apiKey}");
            request.AddJsonBody(new { inputs = texts, model, provider = "hf-inference" });

            var response = await _client.ExecuteAsync(request);

            if (!response.IsSuccessful)
            {
                throw new Exception($"Embedding API error: {response.Content}");
            }

            var embeddings = JsonSerializer.Deserialize<float[][]>(response.Content);
            return embeddings;
        }

        public string ConvertUserProfileToCourseText(UserLearningProfile profile, List<CourseSubjectPreference> preferences)
        {
            var textParts = new List<string>();

            // Sắp xếp theo độ ưu tiên môn yếu (cao nhất lên đầu)
            var sortedPreferences = preferences.OrderByDescending(p => p.WeakSubjectPriority).ToList();

            foreach (var pref in sortedPreferences)
            {
                var difficultyName = pref.PreferredDifficulty.ToString().ToLower();
                var lengthName = pref.PreferredLength.ToString().ToLower();

                // Đánh dấu priority cho môn yếu (strength < 0.6)
                var priority = pref.WeakSubjectPriority > 0.4f ? "priority" : "";

                textParts.Add(
                    $"Subject: {pref.SubjectName} | " +
                    $"Level: {difficultyName} | " +
                    $"Length: {lengthName}" +
                    $"| Priority: {pref.WeakSubjectPriority:F2} {priority}".Trim()
                //$" {priority}".Trim()
                );
            }

            return string.Join(". ", textParts);
        }

        public string ConvertUserProfileToDocumentText(UserLearningProfile profile, List<DocumentSubjectPreference> preferences)
        {
            var textParts = new List<string>();

            // Sắp xếp theo độ ưu tiên môn yếu (cao nhất lên đầu)
            var sortedPreferences = preferences.OrderByDescending(p => p.WeakSubjectPriority).ToList();

            foreach (var pref in sortedPreferences)
            {
                var difficultyName = pref.PreferredDifficulty.ToString().ToLower();
                var lengthName = pref.PreferredLength.ToString().ToLower();

                // Đánh dấu priority cho môn yếu (strength < 0.6)
                var priority = pref.WeakSubjectPriority > 0.4f ? "priority" : "";

                textParts.Add(
                    $"Subject: {pref.SubjectName} | " +
                    $"Level: {difficultyName} | " +
                    $"Length: {lengthName}" +
                    $"| Priority: {pref.WeakSubjectPriority:F2} {priority}".Trim()
                //$" {priority}".Trim()
                );
            }

            return string.Join(". ", textParts);
        }

        // Chuyển Course thành text cho embedding
        public string ConvertCourseToText(Course course)
        {
            return $"Subject: {course.Subject.Name} | " +
                   $"Level: {course.Difficulty.ToString().ToLower()} | " +
                   $"Length: {course.Length.ToString().ToLower()} | " +
                   $"Grade: {course.Grade} | " +
                   $"Course: {course.Name} | " +
                   $"Info: {course.Information}";
        }

        // Chuyển Document thành text cho embedding
        public string ConvertDocumentToText(Document document)
        {
            var subject = document.Subject?.Name ?? string.Empty;
            return $"Subject: {subject} | " +
                   $"Level: {document.DocumentLevel.ToLower()} | " +
                   $"Length: {document.DocumentLengthType.ToLower()} | " +
                   $"Grade: {document.Grade} | " +
                   $"Title: {document.Name} | " +
                   $"Description: {document.Description}";
        }

        public string ConvertEmbeddingCourseToText(Course course)
        {
            return $"Subject: {course.Subject?.Name} | " +
                   $"Level: {course.Difficulty.ToString().ToLower()} | " +
                   $"Length: {course.Length.ToString().ToLower()} | " +
                   $"Grade: {course.Grade} | " +
                   $"Course: {course.Name} | " +
                   $"Info: {course.Information}";
        }

        public string ConvertEmbeddingDocumentToText(Document doc)
        {
            var subject = doc.Subject?.Name;
            return $"Subject: {subject} | " +
                   $"Level: {doc.DocumentLevel.ToLower()} | " +
                   $"Length: {doc.DocumentLengthType.ToLower()} | " +
                   $"Grade: {doc.Grade} | " +
                   $"Title: {doc.Name} | " +
                   $"Description: {doc.Description}";
        }

        // Helper: Build query text cho embedding (chỉ goal + topic)
        public string BuildQueryTextForEmbedding(UserPreferenceProfile profile)
        {
            var parts = new List<string>();

            // Add goal
            parts.Add(profile.Goal);

            // Add topic keywords
            parts.AddRange(profile.TopicKeywords);

            return string.Join(" ", parts);
        }
    }
}
