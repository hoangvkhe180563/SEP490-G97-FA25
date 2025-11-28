using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StudyHub.Backend.Domain.Entities;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Collections.Concurrent;

namespace StudyHub.Backend.UseCases.Services
{
    public interface IImageModerationService
    {
        Task<ImageModerationResult> ModerateImageAsync(string imageUrl);
        Task<ImageModerationResult> ModerateImageFromStreamAsync(Stream imageStream);
        Task<List<ImageModerationResult>> ModerateBatchFromStreamsAsync(List<Stream> imageStreams);
    }

    public class ImageDectectService : IImageModerationService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ImageDectectService> _logger;
        private readonly IConfiguration _configuration;
        private readonly List<ModerationModel> _models;
        private const int MAX_RETRIES = 1;
        private const int RETRY_DELAY_MS = 1000;
        private const int PARALLEL_LIMIT = 20;
        private const int MODEL_TIMEOUT_SECONDS = 15;
        private readonly ConcurrentDictionary<string, ImageModerationResult> _resultCache;

        public ImageDectectService(
            ILogger<ImageDectectService> logger,
            IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            _resultCache = new ConcurrentDictionary<string, ImageModerationResult>();

            var token = _configuration["HuggingFace:ApiToken"];
            if (string.IsNullOrWhiteSpace(token))
                throw new InvalidOperationException("HuggingFace token not configured in appsettings.json");

            _httpClient = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(60),
                DefaultRequestVersion = HttpVersion.Version20,
                DefaultVersionPolicy = HttpVersionPolicy.RequestVersionOrHigher
            };
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            _httpClient.DefaultRequestHeaders.ConnectionClose = false;

            _models = new List<ModerationModel>
        {
            new ModerationModel
            {
                Name = "NSFW Classifier",
                ModelPath = "Falconsai/nsfw_image_detection",
                Threshold = 0.3,
                ViolationLabels = new List<string> { "nsfw", "porn", "sexy", "hentai" },
                ViolationType = "NSFW"
            },
            new ModerationModel
            {
                Name = "NSFW Detector",
                ModelPath = "google/vit-base-patch16-224",
                Threshold = 0.3,
                ViolationLabels = new List<string> { "nsfw", "porn", "sexy", "hentai", "drawing" },
                ViolationType = "NSFW"
            },
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

        public async Task<List<ImageModerationResult>> ModerateBatchFromStreamsAsync(List<Stream> imageStreams)
        {
            try
            {
                var imageBytesListTasks = imageStreams.Select(async stream =>
                {
                    using var memoryStream = new MemoryStream();
                    await stream.CopyToAsync(memoryStream);
                    return memoryStream.ToArray();
                });

                var imageBytesList = await Task.WhenAll(imageBytesListTasks);

                _logger.LogInformation($"Batch moderating {imageBytesList.Length} images");

                return await CheckAllModelsBatch(imageBytesList.ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error batch moderating images from streams");
                throw;
            }
        }

        private async Task<List<ImageModerationResult>> CheckAllModelsBatch(List<byte[]> imageBytesList)
        {
            var results = new ImageModerationResult[imageBytesList.Count];
            var foundViolations = new bool[imageBytesList.Count];

            for (int i = 0; i < imageBytesList.Count; i++)
            {
                results[i] = new ImageModerationResult
                {
                    IsViolation = false,
                    ViolationType = null,
                    Likelihood = "0.0000",
                    Details = "Passed",
                    AllScores = new Dictionary<string, double>()
                };
            }

            foreach (var model in _models)
            {
                var imagesToCheck = imageBytesList
                    .Select((bytes, index) => new { bytes, index })
                    .Where(x => !foundViolations[x.index])
                    .ToList();

                if (!imagesToCheck.Any()) break;

                var modelTasks = imagesToCheck.Select(async imageData =>
                {
                    try
                    {
                        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(MODEL_TIMEOUT_SECONDS));
                        var result = await CheckWithModel(imageData.bytes, model, cts.Token);
                        return new { result, imageData.index };
                    }
                    catch (OperationCanceledException)
                    {
                        _logger.LogWarning($"Model {model.Name} timeout for image {imageData.index}");
                        return new { result = (ImageModerationResult?)null, imageData.index };
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, $"Error checking image {imageData.index} with model {model.Name}");
                        return new { result = (ImageModerationResult?)null, imageData.index };
                    }
                });

                var modelResults = await Task.WhenAll(modelTasks);

                foreach (var item in modelResults.Where(x => x.result != null))
                {
                    if (item.result!.IsViolation)
                    {
                        results[item.index] = item.result;
                        foundViolations[item.index] = true;
                        _logger.LogWarning($"Violation detected in image {item.index}: {item.result.ViolationType}");
                    }
                }
            }

            return results.ToList();
        }

        private async Task<ImageModerationResult> CheckAllModels(byte[] imageBytes)
        {
            var tasks = _models.Select(async model =>
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(MODEL_TIMEOUT_SECONDS));
                return await CheckWithModel(imageBytes, model, cts.Token);
            }).ToList();

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
                catch (OperationCanceledException)
                {
                    _logger.LogWarning($"Model timeout, continuing...");
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

        private async Task<ImageModerationResult> CheckWithModel(byte[] imageBytes, ModerationModel model, CancellationToken cancellationToken = default)
        {
            try
            {
                var modelUrl = $"https://router.huggingface.co/hf-inference/models/{model.ModelPath}";

                var content = new ByteArrayContent(imageBytes);
                content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");

                var response = await _httpClient.PostAsync(modelUrl, content, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning($"Model {model.Name} returned {response.StatusCode}");
                    return new ImageModerationResult
                    {
                        IsViolation = false,
                        ViolationType = null,
                        Likelihood = "0.0000",
                        Details = "Model unavailable",
                        AllScores = new Dictionary<string, double>(),
                        ModelPath = model.ModelPath
                    };
                }

                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                var data = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(json);

                if (data == null || data.Count == 0)
                {
                    return new ImageModerationResult
                    {
                        IsViolation = false,
                        ViolationType = null,
                        Likelihood = "0.0000",
                        Details = "No data",
                        AllScores = new Dictionary<string, double>(),
                        ModelPath = model.ModelPath
                    };
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
            catch (OperationCanceledException)
            {
                _logger.LogWarning($"Model {model.Name} timeout");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in CheckWithModel for {model.Name}");
                return new ImageModerationResult
                {
                    IsViolation = false,
                    ViolationType = null,
                    Likelihood = "0.0000",
                    Details = $"Error: {ex.Message}",
                    AllScores = new Dictionary<string, double>()
                };
            }
        }

        public async Task<List<ImageModerationResult>> ModerateBatchAsync(List<byte[]> imageBytesList)
        {
            return await CheckAllModelsBatch(imageBytesList);
        }
    }
}