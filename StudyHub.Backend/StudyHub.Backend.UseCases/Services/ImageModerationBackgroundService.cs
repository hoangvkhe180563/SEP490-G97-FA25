using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace StudyHub.Backend.Api.BackgroundServices
{
    public class ImageModerationBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ImageModerationBackgroundService> _logger;
        private const int CHECK_INTERVAL_MS = 5000;
        private const int BATCH_SIZE = 50;
        private const int MAX_IMAGES_PER_BATCH = 10;

        public ImageModerationBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<ImageModerationBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            Console.WriteLine("[ImageModerationBackgroundService] Starting...");
            _logger.LogInformation("[ImageModerationBackgroundService] Starting...");

            await Task.Delay(5000, stoppingToken);

            Console.WriteLine("[ImageModerationBackgroundService] Started");
            _logger.LogInformation("[ImageModerationBackgroundService] Started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    Console.WriteLine("[ImageModerationBackgroundService] Checking for pending images...");
                    await ProcessPendingImages(stoppingToken);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ImageModerationBackgroundService] ERROR: {ex.Message}");
                    Console.WriteLine($"[ImageModerationBackgroundService] StackTrace: {ex.StackTrace}");
                    _logger.LogError(ex, "[ImageModerationBackgroundService] Error processing pending images");
                }

                await Task.Delay(CHECK_INTERVAL_MS, stoppingToken);
            }
        }

        private async Task ProcessPendingImages(CancellationToken stoppingToken)
        {
            using var mainScope = _serviceProvider.CreateScope();
            var mainConfigRepo = mainScope.ServiceProvider.GetRequiredService<IForumConfigRepository>();

            var pendingAttachments = await mainConfigRepo.GetPendingModerationAttachmentsAsync(BATCH_SIZE);

            if (!pendingAttachments.Any())
            {
                Console.WriteLine("[ProcessPendingImages] No pending attachments found");
                return;
            }

            Console.WriteLine($"[ProcessPendingImages] Found {pendingAttachments.Count} pending attachments");

            var groupedByPost = pendingAttachments
                .Where(a => a.PostId.HasValue)
                .GroupBy(a => a.PostId.Value)
                .ToList();

            Console.WriteLine($"[ProcessPendingImages] Grouped into {groupedByPost.Count} posts");

            foreach (var postGroup in groupedByPost)
            {
                if (stoppingToken.IsCancellationRequested) break;

                await ProcessSinglePost(postGroup.Key, postGroup.ToList(), stoppingToken);
            }

            Console.WriteLine($"[ProcessPendingImages] Finished batch of {pendingAttachments.Count} attachments");
        }

        private async Task ProcessSinglePost(int postId, List<ForumAttachment> attachments, CancellationToken stoppingToken)
        {
            Console.WriteLine($"Processing {attachments.Count} images for post {postId}");

            using var postScope = _serviceProvider.CreateScope();
            var configRepo = postScope.ServiceProvider.GetRequiredService<IForumConfigRepository>();
            var moderationService = postScope.ServiceProvider.GetRequiredService<IImageModerationService>();
            var moderationRepo = postScope.ServiceProvider.GetRequiredService<IForumModerationRepository>();
            var postRepo = postScope.ServiceProvider.GetRequiredService<IForumPostRepository>();
            var fileStorage = postScope.ServiceProvider.GetRequiredService<ICloudinaryRepository>();

            try
            {
                var imageBytes = new List<byte[]>();
                var validAttachments = new List<ForumAttachment>();
                var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };

                foreach (var attachment in attachments)
                {
                    var extension = Path.GetExtension(attachment.FileUrl).ToLowerInvariant();

                    if (!imageExtensions.Contains(extension))
                    {
                        await configRepo.UpdateAttachmentModerationStatusAsync(attachment.Id, true, false);
                        continue;
                    }

                    try
                    {
                        var bytes = await fileStorage.ReadFileAsync(attachment.FileUrl);
                        imageBytes.Add(bytes);
                        validAttachments.Add(attachment);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to read attachment {attachment.Id}: {ex.Message}");
                        await configRepo.UpdateAttachmentModerationStatusAsync(attachment.Id, true, false);
                    }
                }

                if (imageBytes.Count == 0)
                {
                    Console.WriteLine($"No valid images for post {postId}");
                    return;
                }

                Console.WriteLine($"Moderating {imageBytes.Count} images for post {postId}");

                var batchResults = new List<ImageModerationResult>();

                for (int i = 0; i < imageBytes.Count; i += MAX_IMAGES_PER_BATCH)
                {
                    var batch = imageBytes.Skip(i).Take(MAX_IMAGES_PER_BATCH).ToList();
                    var streams = batch.Select(b => new MemoryStream(b) as Stream).ToList();

                    try
                    {
                        var results = await moderationService.ModerateBatchFromStreamsAsync(streams);
                        batchResults.AddRange(results);
                        Console.WriteLine($"Moderated batch {i / MAX_IMAGES_PER_BATCH + 1} for post {postId}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed batch moderation: {ex.Message}");
                        batchResults.AddRange(Enumerable.Repeat(new ImageModerationResult
                        {
                            IsViolation = false,
                            Details = "Moderation failed"
                        }, batch.Count));
                    }
                    finally
                    {
                        foreach (var stream in streams) stream.Dispose();
                    }
                }

                bool hasAnyViolation = batchResults.Any(r => r.IsViolation);

                Console.WriteLine($"Results for post {postId}: {batchResults.Count(r => r.IsViolation)} violations found");

                if (hasAnyViolation)
                {
                    Console.WriteLine($"Post {postId} has violations, rejecting ALL attachments...");

                    var allAttachmentsInPost = await configRepo.GetAttachmentsByPostIdAsync(postId);

                    foreach (var att in allAttachmentsInPost)
                    {
                        try
                        {
                            await configRepo.UpdateAttachmentModerationStatusAsync(att.Id, true, true);
                            Console.WriteLine($"Rejected attachment {att.Id}");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Failed to reject attachment {att.Id}: {ex.Message}");
                        }
                    }

                    var post = await postRepo.GetPostByIdAsync(postId);
                    if (post == null)
                    {
                        Console.WriteLine($"Post {postId} not found!");
                        return;
                    }

                    var isProtectedFlair = post.Flair?.IsProtected ?? false;
                    Console.WriteLine($"Post {postId}: Status={post.Status}, IsHidden={post.IsHidden}, Protected={isProtectedFlair}");

                    post.TotalViolationScore += 10;

                    await moderationRepo.CreateViolationRecordAsync(new ViolationRecord
                    {
                        UserId = post.CreatedBy,
                        SchoolId = post.SchoolId,
                        PostId = post.Id,
                        ViolationScore = 10,
                        SourceType = "auto",
                        CreatedAt = DateTime.Now
                    });

                    if (isProtectedFlair)
                    {
                        if (post.Status == true)
                        {
                            post.Status = null;
                            Console.WriteLine($"Post {post.Id} (protected) moved to PENDING");
                        }
                    }
                    else
                    {
                        if (post.Status == true)
                        {
                            post.Status = false;
                            post.IsHidden = true;
                            await moderationRepo.AddViolationScoreAsync(post.CreatedBy, post.SchoolId, 10);
                            Console.WriteLine($"Post {post.Id} REJECTED and HIDDEN");
                        }
                    }

                    await postRepo.UpdatePostAsync(post);
                    Console.WriteLine($"Updated post {post.Id} in database");

                    if (!isProtectedFlair)
                    {
                        var userStatus = await moderationRepo.GetUserForumStatusAsync(post.CreatedBy, post.SchoolId);
                        if (userStatus != null && userStatus.TotalViolationScore <= 0)
                        {
                            await moderationRepo.MuteUserAsync(post.CreatedBy, post.SchoolId, DateTime.Now.AddDays(7));
                            Console.WriteLine($"User {post.CreatedBy} MUTED for 7 days");
                        }
                    }
                }
                else
                {
                    Console.WriteLine($"Post {postId} passed all checks, approving attachments...");

                    for (int i = 0; i < validAttachments.Count; i++)
                    {
                        try
                        {
                            await configRepo.UpdateAttachmentModerationStatusAsync(
                                validAttachments[i].Id,
                                true,
                                false
                            );
                            Console.WriteLine($"Approved attachment {validAttachments[i].Id}");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Failed to approve attachment {validAttachments[i].Id}: {ex.Message}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CRITICAL ERROR processing post {postId}: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");

                foreach (var att in attachments)
                {
                    try
                    {
                        using var errorScope = _serviceProvider.CreateScope();
                        var errorConfigRepo = errorScope.ServiceProvider.GetRequiredService<IForumConfigRepository>();
                        await errorConfigRepo.UpdateAttachmentModerationStatusAsync(att.Id, true, false);
                    }
                    catch { }
                }
            }
        }
    }
}