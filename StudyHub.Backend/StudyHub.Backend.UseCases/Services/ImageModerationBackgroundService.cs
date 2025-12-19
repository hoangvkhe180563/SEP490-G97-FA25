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

namespace StudyHub.Backend.UseCases.Services
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
    
            await Task.Delay(5000, stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessPendingImages(stoppingToken);
                }
                catch (Exception ex)
                {
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
                return;
            }


            var groupedByPost = pendingAttachments
                .Where(a => a.PostId.HasValue)
                .GroupBy(a => a.PostId.Value)
                .ToList();

            foreach (var postGroup in groupedByPost)
            {
                if (stoppingToken.IsCancellationRequested) break;

                await ProcessSinglePost(postGroup.Key, postGroup.ToList(), stoppingToken);
            }

        }

        private async Task ProcessSinglePost(int postId, List<ForumAttachment> attachments, CancellationToken stoppingToken)
        {

            using var postScope = _serviceProvider.CreateScope();
            var configRepo = postScope.ServiceProvider.GetRequiredService<IForumConfigRepository>();
            var moderationService = postScope.ServiceProvider.GetRequiredService<IImageModerationService>();
            var moderationRepo = postScope.ServiceProvider.GetRequiredService<IForumModerationRepository>();
            var postRepo = postScope.ServiceProvider.GetRequiredService<IForumPostRepository>();
            var fileStorage = postScope.ServiceProvider.GetRequiredService<ICloudinaryRepository>();
            var signalRNotifier = postScope.ServiceProvider.GetRequiredService<ISignalRNotifier>();

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
                        await configRepo.UpdateAttachmentModerationStatusAsync(attachment.Id, true, false);
                    }
                }

                if (imageBytes.Count == 0)
                {
                    return;
                }


                var batchResults = new List<ImageModerationResult>();

                for (int i = 0; i < imageBytes.Count; i += MAX_IMAGES_PER_BATCH)
                {
                    var batch = imageBytes.Skip(i).Take(MAX_IMAGES_PER_BATCH).ToList();
                    var streams = batch.Select(b => new MemoryStream(b) as Stream).ToList();

                    try
                    {
                        var results = await moderationService.ModerateBatchFromStreamsAsync(streams);
                        batchResults.AddRange(results);
                    }
                    catch (Exception ex)
                    {
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

                if (hasAnyViolation)
                {

                    var allAttachmentsInPost = await configRepo.GetAttachmentsByPostIdAsync(postId);

                    foreach (var att in allAttachmentsInPost)
                    {
                        try
                        {
                            await configRepo.UpdateAttachmentModerationStatusAsync(att.Id, true, true);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Failed to reject attachment {att.Id}: {ex.Message}");
                        }
                    }

                    var post = await postRepo.GetPostByIdAsync(postId);
                    if (post == null)
                    {
                        return;
                    }

                    var isProtectedFlair = post.Flair?.IsProtected ?? false;

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

                    await Task.Delay(500);

                    var updatedPost = await postRepo.GetPostByIdAsync(postId);
                    if (updatedPost != null)
                    {
                        await signalRNotifier.NotifyPostUpdated(postId, post.SchoolId);
                        Console.WriteLine($"Sent SignalR notification for post {postId}");
                    }

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