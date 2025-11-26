using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StudyHub.Backend.Domain.Entities;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

namespace StudyHub.Backend.UseCases.Services
{
    public interface IImageModerationService
    {
        Task<ImageModerationResult> ModerateImageAsync(string imageUrl);
        Task<ImageModerationResult> ModerateImageFromStreamAsync(Stream imageStream);
    }
    public class ImageDectectService : IImageModerationService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ImageDectectService> _logger;
        private readonly IConfiguration _configuration;
        private readonly List<ModerationModel> _models;
        private const int MAX_RETRIES = 1;
        private const int RETRY_DELAY_MS = 1000;
        private const int PARALLEL_LIMIT = 10;

        public ImageDectectService(
            ILogger<ImageDectectService> logger,
            IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;

            var token = _configuration["HuggingFace:ApiToken"];
            if (string.IsNullOrWhiteSpace(token))
                throw new InvalidOperationException("HuggingFace token not configured in appsettings.json");

            _httpClient = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(15),
                DefaultRequestVersion = HttpVersion.Version20,
                DefaultVersionPolicy = HttpVersionPolicy.RequestVersionOrHigher
            };
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            _httpClient.DefaultRequestHeaders.ConnectionClose = false;

            _models = new List<ModerationModel>
            {
                new ModerationModel
                {
                    Name = "NSFW Detector",
                    ModelPath = "google/vit-base-patch16-224",
                    Threshold = 0.3,
                    ViolationLabels = new List<string> { "nsfw", "porn", "sexy", "hentai", "drawing" },
                    ViolationType = "NSFW"
                },
                //new ModerationModel
                //{
                //    Name = "NSFW Classifier",
                //    ModelPath = "microsoft/resnet-50",
                //    Threshold = 0.65,
                //    ViolationLabels = new List<string> { "porn", "sexy", "nude" },
                //    ViolationType = "NSFW"
                //}
            };

            var customModels = _configuration.GetSection("HuggingFace:Models").Get<List<ModerationModel>>();
            if (customModels != null && customModels.Any())
            {
                _models = customModels;
            }

            _logger.LogInformation($"Loaded {_models.Count} moderation models");
        }

        public async Task<ImageModerationResult> ModerateImageAsync(string imageUrl)
        {
            try
            {
                _logger.LogInformation($"Moderating image through {_models.Count} models: {imageUrl}");

                byte[] imageBytes;
                using (var imageClient = new HttpClient { Timeout = TimeSpan.FromSeconds(15) })
                {
                    imageBytes = await imageClient.GetByteArrayAsync(imageUrl);
                }

                return await CheckAllModels(imageBytes);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, $"Connection error downloading image: {imageUrl}");
                throw new InvalidOperationException("Cannot download image from URL. Please try again later.", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error moderating image: {imageUrl}");
                throw;
            }
        }

        public async Task<ImageModerationResult> ModerateImageFromStreamAsync(Stream imageStream)
        {
            try
            {
                using var memoryStream = new MemoryStream();
                await imageStream.CopyToAsync(memoryStream);
                byte[] imageBytes = memoryStream.ToArray();

                _logger.LogInformation($"Moderating image from stream: {imageBytes.Length} bytes");

                return await CheckAllModels(imageBytes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error moderating image from stream");
                throw;
            }
        }

        private async Task<ImageModerationResult> CheckAllModels(byte[] imageBytes)
        {
            var tasks = _models.Select(model => CheckWithModel(imageBytes, model)).ToList();

            while (tasks.Any())
            {
                var completedTask = await Task.WhenAny(tasks);
                tasks.Remove(completedTask);

                try
                {
                    var result = await completedTask;

                    if (result.IsViolation)
                    {
                        _logger.LogWarning($"Violation detected: {result.ViolationType}");
                        return result;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Error checking model, skipping...");
                }
            }

            return new ImageModerationResult
            {
                IsViolation = false,
                ViolationType = null,
                Likelihood = "0.0000",
                Details = "Passed",
                AllScores = new Dictionary<string, double>()
            };
        }

        private async Task<ImageModerationResult> CheckWithModel(byte[] imageBytes, ModerationModel model)
        {
            var modelUrl = $"https://router.huggingface.co/hf-inference/models/{model.ModelPath}";

            var content = new ByteArrayContent(imageBytes);
            content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");

            var response = await _httpClient.PostAsync(modelUrl, content);

            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"Error from {model.Name}: {response.StatusCode}");
            }

            var json = await response.Content.ReadAsStringAsync();
            var data = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(json);

            if (data == null || data.Count == 0)
            {
                throw new InvalidOperationException($"API returned empty data");
            }

            double maxScore = 0;
            bool foundViolation = false;

            foreach (var item in data)
            {
                if (item.ContainsKey("label") && item.ContainsKey("score"))
                {
                    var label = item["label"].GetString()?.ToLower() ?? "";
                    var score = item["score"].GetDouble();

                    if (model.ViolationLabels.Contains(label) && score > model.Threshold)
                    {
                        foundViolation = true;
                        if (score > maxScore) maxScore = score;
                    }
                }
            }

            return new ImageModerationResult
            {
                IsViolation = foundViolation,
                ViolationType = foundViolation ? model.ViolationType : null,
                Likelihood = maxScore.ToString("0.00"),
                Details = foundViolation ? "Violation" : "Safe",
                AllScores = new Dictionary<string, double>(),
                ModelPath = model.ModelPath
            };
        }

        public async Task<List<ImageModerationResult>> ModerateBatchAsync(List<byte[]> imageBytesList)
        {
            var semaphore = new SemaphoreSlim(PARALLEL_LIMIT);
            var tasks = imageBytesList.Select(async imageBytes =>
            {
                await semaphore.WaitAsync();
                try
                {
                    return await CheckAllModels(imageBytes);
                }
                finally
                {
                    semaphore.Release();
                }
            });

            return (await Task.WhenAll(tasks)).ToList();
        }
    }
}