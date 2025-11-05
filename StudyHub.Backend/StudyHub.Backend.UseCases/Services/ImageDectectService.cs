using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.IServices;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

namespace StudyHub.Backend.UseCases.Services
{
    public class ImageDectectService : IImageModerationService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ImageDectectService> _logger;
        private readonly IConfiguration _configuration;
        private readonly List<ModerationModel> _models;
        private const int MAX_RETRIES = 3;
        private const int RETRY_DELAY_MS = 3000;
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
                Timeout = TimeSpan.FromSeconds(60)
            };
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            _models = new List<ModerationModel>
            {
                new ModerationModel
                {
                    Name = "NSFW Detector",
                    ModelPath = "google/vit-base-patch16-224",
                    Threshold = 0.7,
                    ViolationLabels = new List<string> { "nsfw", "porn", "sexy", "hentai", "drawing" },
                    ViolationType = "NSFW"
                },
                new ModerationModel
                {
                    Name = "NSFW Classifier",
                    ModelPath = "microsoft/resnet-50",
                    Threshold = 0.65,
                    ViolationLabels = new List<string> { "porn", "sexy", "nude" },
                    ViolationType = "NSFW"
                }
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
                using (var imageClient = new HttpClient { Timeout = TimeSpan.FromSeconds(20) })
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
            var allScores = new Dictionary<string, double>();

            foreach (var model in _models)
            {
                try
                {
                    var result = await CheckWithModel(imageBytes, model);

                    foreach (var score in result.AllScores)
                    {
                        allScores[$"{model.ViolationType}_{score.Key}"] = score.Value;
                    }

                    if (result.IsViolation)
                    {
                        _logger.LogWarning($"[{model.Name}] Violation detected: {result.ViolationType}");
                        result.AllScores = allScores;
                        return result;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Error checking model {model.Name}, skipping...");
                }
            }

            _logger.LogInformation($"Image passed all {_models.Count} moderation checks");
            return new ImageModerationResult
            {
                IsViolation = false,
                ViolationType = null,
                Likelihood = "0.0000",
                Details = "Passed all moderation checks",
                AllScores = allScores
            };
        }

        private async Task<ImageModerationResult> CheckWithModel(byte[] imageBytes, ModerationModel model)
        {
            var modelUrl = $"https://router.huggingface.co/hf-inference/models/{model.ModelPath}";
            Exception? lastException = null;

            for (int attempt = 1; attempt <= MAX_RETRIES; attempt++)
            {
                try
                {
                    var content = new ByteArrayContent(imageBytes);
                    content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");

                    var response = await _httpClient.PostAsync(modelUrl, content);

                    if (response.StatusCode == HttpStatusCode.Forbidden)
                    {
                        var errorContent = await response.Content.ReadAsStringAsync();
                        _logger.LogError($"[{model.Name}] 403 Forbidden: {errorContent}");
                        throw new InvalidOperationException("HuggingFace token is invalid or expired.");
                    }

                    if (response.StatusCode == HttpStatusCode.Gone)
                    {
                        var errorBody = await response.Content.ReadAsStringAsync();
                        _logger.LogError($"[{model.Name}] 410 Gone - Model no longer exists: {errorBody}");
                        throw new InvalidOperationException($"Model {model.Name} no longer exists (410 Gone)");
                    }

                    if (response.StatusCode == HttpStatusCode.ServiceUnavailable)
                    {
                        var errorJson = await response.Content.ReadAsStringAsync();
                        if (errorJson.Contains("loading") && attempt < MAX_RETRIES)
                        {
                            var delay = RETRY_DELAY_MS * attempt;
                            _logger.LogWarning($"[{model.Name}] Model loading, waiting {delay}ms...");
                            await Task.Delay(delay);
                            continue;
                        }
                    }

                    if (!response.IsSuccessStatusCode)
                    {
                        var errorContent = await response.Content.ReadAsStringAsync();
                        _logger.LogError($"[{model.Name}] HTTP {(int)response.StatusCode} - {errorContent}");

                        if (attempt < MAX_RETRIES)
                        {
                            await Task.Delay(RETRY_DELAY_MS);
                            continue;
                        }
                        throw new InvalidOperationException($"Error from {model.Name}: {response.StatusCode}");
                    }

                    var json = await response.Content.ReadAsStringAsync();
                    var data = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(json);

                    if (data == null || data.Count == 0)
                    {
                        throw new InvalidOperationException($"[{model.Name}] API returned empty data");
                    }

                    var scores = new Dictionary<string, double>();
                    foreach (var item in data)
                    {
                        if (item.ContainsKey("label") && item.ContainsKey("score"))
                        {
                            var label = item["label"].GetString()?.ToLower() ?? "";
                            var score = item["score"].GetDouble();
                            scores[label] = score;
                        }
                    }

                    double totalScore = scores.Values.Sum();
                    double maxViolationScore = 0;
                    double maxViolationRatio = 0;

                    foreach (var label in model.ViolationLabels)
                    {
                        if (scores.ContainsKey(label))
                        {
                            double ratio = totalScore > 0 ? scores[label] / totalScore : 0;
                            if (ratio > maxViolationRatio)
                            {
                                maxViolationRatio = ratio;
                                maxViolationScore = scores[label];
                            }
                        }
                    }

                    bool isViolation = maxViolationRatio > model.Threshold;

                    return new ImageModerationResult
                    {
                        IsViolation = isViolation,
                        ViolationType = isViolation ? model.ViolationType : null,
                        Likelihood = maxViolationScore.ToString("0.0000"),
                        Details = string.Join(", ", scores.Select(s => $"{s.Key}={s.Value:0.0000}")),
                        AllScores = scores
                    };
                }
                catch (TaskCanceledException ex)
                {
                    lastException = ex;
                    _logger.LogWarning($"[{model.Name}] Timeout at attempt {attempt}");
                    if (attempt < MAX_RETRIES)
                    {
                        await Task.Delay(RETRY_DELAY_MS);
                        continue;
                    }
                }
                catch (HttpRequestException ex)
                {
                    lastException = ex;
                    _logger.LogWarning(ex, $"[{model.Name}] Network error at attempt {attempt}");
                    if (attempt < MAX_RETRIES)
                    {
                        await Task.Delay(RETRY_DELAY_MS);
                        continue;
                    }
                }
                catch (InvalidOperationException)
                {
                    throw;
                }
            }

            throw new InvalidOperationException(
                $"Cannot check model {model.Name} after {MAX_RETRIES} attempts.",
                lastException);
        }
    }
}

