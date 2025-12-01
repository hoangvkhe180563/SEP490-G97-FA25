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

            var model = configuration["HuggingFace:EmbeddingModel"] ?? "intfloat/multilingual-e5-large-instruct";
            var apiKey = configuration["HuggingFace:ApiToken"] ?? "";

            var request = new RestRequest($"models/{model}/pipeline/feature-extraction", Method.Post);
            request.AddHeader("Authorization", $"Bearer {apiKey}");
            request.AddJsonBody(new { inputs = text });

            var response = await _client.ExecuteAsync(request);

            if (!response.IsSuccessful)
            {
                throw new Exception($"Embedding API error: {response.Content}");
            }

            var embeddings = JsonSerializer.Deserialize<float[]>(response.Content);
            return embeddings;
        }

        public async Task<float[][]> GetEmbeddingsBatchAsync(List<string> texts, int? batchSize = 5)
        {
            if (texts == null || texts.Count == 0)
                return Array.Empty<float[]>();

            var model = configuration["HuggingFace:EmbeddingModel"] ?? "intfloat/multilingual-e5-large-instruct";
            var apiKey = configuration["HuggingFace:ApiToken"] ?? "";

            // Tách thành batch 5
            var batches = texts
                .Select((text, index) => new { text, index })
                .GroupBy(x => x.index / batchSize)
                .Select(g => g.ToList())
                .ToList();

            // Số luồng = số batch (hoặc bạn có thể giới hạn max)
            int parallelCount = batches.Count;

            var semaphore = new SemaphoreSlim(parallelCount);

            var tasks = new List<Task<(int batchIndex, List<(int index, float[])> vectors)>>();

            for (int batchIndex = 0; batchIndex < batches.Count; batchIndex++)
            {
                int bi = batchIndex;
                var batch = batches[batchIndex];

                tasks.Add(Task.Run(async () =>
                {
                    await semaphore.WaitAsync();

                    try
                    {
                        // Lấy danh sách text trong batch
                        var inputs = batch.Select(x => x.text).ToArray();

                        var request = new RestRequest($"/models/{model}/pipeline/feature-extraction", Method.Post);
                        request.AddHeader("Authorization", $"Bearer {apiKey}");
                        request.AddHeader("Content-Type", "application/json");

                        request.AddJsonBody(new
                        {
                            inputs = inputs
                        });

                        var response = await _client.ExecuteAsync(request);

                        if (!response.IsSuccessful)
                            throw new Exception($"Embedding API error: {response.StatusCode} - {response.Content}");

                        var vectors = JsonSerializer.Deserialize<float[][]>(response.Content);

                        // Trả về từng vector kèm đúng index của nó
                        var results = new List<(int index, float[])>();

                        for (int i = 0; i < batch.Count; i++)
                        {
                            results.Add((batch[i].index, vectors[i]));
                        }

                        return (bi, results);
                    }
                    finally
                    {
                        semaphore.Release();
                    }
                }));
            }

            var batchResults = await Task.WhenAll(tasks);

            // Gộp lại + sắp xếp đúng thứ tự input ban đầu
            var finalVectors = batchResults
                .SelectMany(br => br.vectors)
                .OrderBy(x => x.index)
                .Select(x => x.Item2)
                .ToArray();

            return finalVectors;
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
            return $"Title: {course.Name} | " +
                   $"Information: {course.Information}";
        }

        // Chuyển Document thành text cho embedding
        public string ConvertDocumentToText(Document document)
        {
            return $"Title: {document.Name} | " +
                   $"Description: {document.Description}";
        }

        public string ConvertEmbeddingCourseToText(Course course)
        {
            return $"Title: {course.Name} | " +
                   $"Information: {course.Information}";
        }

        public string ConvertEmbeddingDocumentToText(Document doc)
        {
            return $"Title: {doc.Name} | " +
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
