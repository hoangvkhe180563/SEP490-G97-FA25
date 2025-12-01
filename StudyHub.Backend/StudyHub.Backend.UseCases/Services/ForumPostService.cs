﻿using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases.Services
{
    public class ForumPostService
    {
        private readonly IForumPostRepository _postRepo;
        private readonly IForumConfigRepository _configRepo;
        private readonly IForumModerationRepository _moderationRepo;
        private readonly ICloudinaryRepository _fileStorage;
        private readonly IImageModerationService _imageModerationService;
        private readonly ISignalRNotifier _signalRNotifier;

        public ForumPostService(
             IForumPostRepository postRepo,
        IForumConfigRepository configRepo,
        IForumModerationRepository moderationRepo,
        ICloudinaryRepository fileStorage,
        IImageModerationService imageModerationService,
        ISignalRNotifier signalRNotifier)
        {
           _postRepo = postRepo;
        _configRepo = configRepo;
        _moderationRepo = moderationRepo;
        _fileStorage = fileStorage;
        _imageModerationService = imageModerationService;
        _signalRNotifier = signalRNotifier;
        }

        public async Task<ForumPost?> GetPostByIdAsync(int postId)
        {
            return await _postRepo.GetPostByIdAsync(postId);
        }

        public async Task<(List<ForumPost> posts, int totalCount)> GetPublicPostsAsync(
        int schoolId,
        List<short>? subjectIds = null,
        List<int>? flairIds = null,
        string? query = null,
        string? sortBy = null,
        int? pageNumber = null,
        int? pageSize = null)
        {
            return await _postRepo.GetPublicPostsAsync(
                schoolId, subjectIds, flairIds, query, sortBy, pageNumber, pageSize);
        }

        public async Task<(List<ForumPost> posts, int totalCount)> GetOwnedPostsAsync(
            Guid userId,
            int schoolId,
            List<short>? subjectIds = null,
            List<int>? flairIds = null,
            string? query = null,
            bool? status = null,
            DateTime? createdFrom = null,
            DateTime? createdTo = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            return await _postRepo.GetOwnedPostsAsync(
                userId, schoolId, subjectIds, flairIds, query, status,
                createdFrom, createdTo, pageNumber, pageSize);
        }

        public async Task<(List<ForumPost> posts, int totalCount)> GetModeratorPostsAsync(
            int schoolId,
            List<short>? subjectIds = null,
            List<int>? flairIds = null,
            string? query = null,
            string? postStatus = null,
            int? minViolationScore = null,
            int? maxViolationScore = null,
            DateTime? createdFrom = null,
            DateTime? createdTo = null,
            string? sortBy = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            return await _postRepo.GetModeratorPostsAsync(
                schoolId, subjectIds, flairIds, query, postStatus,
                minViolationScore, maxViolationScore, createdFrom, createdTo,
                sortBy, pageNumber, pageSize);
        }
        public async Task<ForumPost> CreatePostAsync(ForumPost post, List<IFormFile>? attachments = null)
        {
            var textViolationsTask = _moderationRepo.CheckContentViolationAsync(post.Content, post.SchoolId);

            ForumFlair? flair = null;
            if (post.FlairId.HasValue)
            {
                flair = await _configRepo.GetFlairByIdAsync(post.FlairId.Value);
            }

            List<ForumAttachment> processedAttachments = new List<ForumAttachment>();

            if (attachments != null && attachments.Any())
            {
                var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };

                foreach (var file in attachments)
                {
                    ValidateAttachmentFile(file);
                }

                var uploadResults = await _fileStorage.UploadFilesAsync(attachments.ToList(), FileConstants.ForumPostAttachmentUploadPath);

                for (int i = 0; i < attachments.Count; i++)
                {
                    var file = attachments[i];
                    var fileUrl = uploadResults[i];
                    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                    bool isImage = imageExtensions.Contains(extension);

                    if (string.IsNullOrWhiteSpace(fileUrl))
                    {
                        throw new InvalidOperationException($"Không thể tải lên file {file.FileName}");
                    }

                    processedAttachments.Add(new ForumAttachment
                    {
                        FileUrl = fileUrl,
                        CreatedBy = post.CreatedBy,
                        CreatedAt = DateTime.Now,
                        IsApproved = true,
                        IsModerationPending = isImage
                    });
                }
            }

            var violations = await textViolationsTask;
            bool hasTextViolations = violations.Any();
            bool hasProtectedFlair = flair?.IsProtected ?? false;

            if (hasTextViolations)
            {
                foreach (var violation in violations)
                {
                    post.TotalViolationScore += violation.ViolationScore;
                }
            }

            if (hasTextViolations)
            {
                if (hasProtectedFlair)
                {
                    post.Status = null;
                }
                else
                {
                    post.Status = false;
                    post.IsHidden = true;

                    foreach (var violation in violations)
                    {
                        await _moderationRepo.AddViolationScoreAsync(post.CreatedBy, post.SchoolId, violation.ViolationScore);
                    }
                }
            }
            else
            {
                post.Status = hasProtectedFlair ? null : true;
            }

            var createdPost = await _postRepo.CreatePostAsync(post);

            if (hasTextViolations && !hasProtectedFlair)
            {
                foreach (var violation in violations)
                {
                    await _moderationRepo.CreateViolationRecordAsync(new ViolationRecord
                    {
                        UserId = post.CreatedBy,
                        SchoolId = post.SchoolId,
                        PostId = createdPost.Id,
                        MatchedRuleId = violation.RuleId,
                        MatchedPatternId = violation.PatternId,
                        ViolationScore = violation.ViolationScore,
                        SourceType = "auto",
                        CreatedAt = DateTime.Now
                    });
                }
            }

            foreach (var attachment in processedAttachments)
            {
                attachment.PostId = createdPost.Id;
                await _configRepo.CreateAttachmentAsync(attachment);
            }

            if (!hasProtectedFlair && hasTextViolations)
            {
                var userStatus = await _moderationRepo.GetUserForumStatusAsync(post.CreatedBy, post.SchoolId);
                if (userStatus != null && userStatus.TotalViolationScore <= 0)
                {
                    await _moderationRepo.MuteUserAsync(post.CreatedBy, post.SchoolId, DateTime.Now.AddDays(7));
                }
            }

            var postWithDetails = await _postRepo.GetPostByIdAsync(createdPost.Id);

            if (hasTextViolations && !hasProtectedFlair && postWithDetails != null)
            {
                await _signalRNotifier.NotifyPostUpdated(createdPost.Id, post.SchoolId);
            }

            return postWithDetails ?? createdPost;
        }

        public async Task<ForumPost> UpdatePostAsync(ForumPost post)
        {
            return await _postRepo.UpdatePostAsync(post);
        }

        public async Task<bool> SoftDeletePostAsync(int postId, Guid deletedBy)
        {
            return await _postRepo.SoftDeletePostAsync(postId, deletedBy);
        }

        public async Task<bool> ApprovePostAsync(int postId, string moderatorId)
        {
            var post = await _postRepo.GetPostByIdAsync(postId);
            if (post == null) return false;

            var attachments = await _configRepo.GetAttachmentsByPostIdAsync(postId);
            foreach (var att in attachments.Where(a => !a.IsApproved))
            {
                await _configRepo.ApproveAttachmentAsync(att.Id, Guid.Parse(moderatorId));
            }

            bool hasProtectedFlair = post.Flair?.IsProtected ?? false;
            if (hasProtectedFlair && post.TotalViolationScore > 0)
            {
                foreach (var violation in post.ViolationRecords ?? new List<ViolationRecord>())
                {
                    if (violation.SourceType == "auto" && violation.ViolationScore > 0)
                    {
                        await _moderationRepo.AddViolationScoreAsync(post.CreatedBy, post.SchoolId, violation.ViolationScore);
                    }
                }
            }

            return await _postRepo.ApprovePostAsync(postId, Guid.Parse(moderatorId));
        }

        public async Task<bool> RejectPostAsync(int postId, string moderatorId)
        {
            var post = await _postRepo.GetPostByIdAsync(postId);
            if (post == null) return false;

            var attachments = await _configRepo.GetAttachmentsByPostIdAsync(postId);
            foreach (var att in attachments)
            {
                await _configRepo.RejectAttachmentAsync(att.Id);
            }

            post.IsHidden = true;
            await _postRepo.UpdatePostAsync(post);

            if (post.TotalViolationScore > 0)
            {
                await _moderationRepo.CreateViolationRecordAsync(new ViolationRecord
                {
                    UserId = post.CreatedBy,
                    SchoolId = post.SchoolId,
                    PostId = postId,
                    ViolationScore = post.TotalViolationScore,
                    SourceType = "manual",
                    CreatedAt = DateTime.Now
                });

                await _moderationRepo.AddViolationScoreAsync(post.CreatedBy, post.SchoolId, post.TotalViolationScore);
            }

            return await _postRepo.RejectPostAsync(postId, Guid.Parse(moderatorId));
        }
        public async Task<bool> ReportPostAsync(int postId, Guid reportedBy, int ruleId, string reason)
        {
            var post = await _postRepo.GetPostByIdAsync(postId);
            if (post == null) return false;

            var rule = await _moderationRepo.GetRuleByIdAsync(ruleId);
            if (rule == null) return false;

            await _moderationRepo.CreateViolationRecordAsync(new ViolationRecord
            {
                UserId = post.CreatedBy,
                SchoolId = post.SchoolId,
                PostId = postId,
                MatchedRuleId = ruleId,
                ViolationScore = 0,
                SourceType = "report",
                ReportedBy = reportedBy,
                CreatedAt = DateTime.Now
            });

            return true;
        }

        public async Task<bool> HidePostByModeratorAsync(int postId, Guid moderatorId, int violationScore)
        {
            var post = await _postRepo.GetPostByIdAsync(postId);
            if (post == null) return false;

            var attachments = await _configRepo.GetAttachmentsByPostIdAsync(postId);
            foreach (var att in attachments.Where(a => a.IsApproved == true))
            {
                await _configRepo.RejectAttachmentAsync(att.Id);
            }

            await _moderationRepo.CreateViolationRecordAsync(new ViolationRecord
            {
                UserId = post.CreatedBy,
                SchoolId = post.SchoolId,
                PostId = postId,
                ViolationScore = violationScore,
                SourceType = "manual",
                CreatedAt = DateTime.Now
            });

            await _moderationRepo.AddViolationScoreAsync(post.CreatedBy, post.SchoolId, violationScore);

            post = await _postRepo.GetPostByIdAsync(postId);

            post.TotalViolationScore += violationScore;
            post.IsHidden = true;
            post.Status = true;


            await _postRepo.UpdatePostAsync(post);

            return true;
        }

        public async Task<ForumPost> UpdatePostWithAttachmentsAsync(ForumPost post, List<IFormFile>? newAttachments, List<string>? deletedAttachmentUrls)
        {
            if (deletedAttachmentUrls != null && deletedAttachmentUrls.Any())
            {
                var existingAttachments = await _configRepo.GetAttachmentsByPostIdAsync(post.Id);

                foreach (var url in deletedAttachmentUrls)
                {
                    var attachment = existingAttachments.FirstOrDefault(a => a.FileUrl == url);
                    if (attachment != null)
                    {
                        await _configRepo.SoftDeleteAttachmentAsync(attachment.Id);
                        await _fileStorage.DeleteFileAsync(attachment.FileUrl);
                    }
                }
            }

            if (newAttachments != null && newAttachments.Any())
            {
                var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };

                foreach (var file in newAttachments)
                {
                    ValidateAttachmentFile(file);

                    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                    bool isImage = imageExtensions.Contains(extension);

                    if (isImage)
                    {
                        var moderationResult = await _imageModerationService.ModerateImageFromStreamAsync(file.OpenReadStream());
                        if (moderationResult.IsViolation)
                        {
                            continue;
                        }
                    }

                    var fileUrl = await _fileStorage.UploadFileAsync(file, FileConstants.ForumPostAttachmentUploadPath);

                    await _configRepo.CreateAttachmentAsync(new ForumAttachment
                    {
                        PostId = post.Id,
                        FileUrl = fileUrl,
                        CreatedBy = post.UpdatedBy ?? post.CreatedBy,
                        CreatedAt = DateTime.Now,
                        IsApproved = true
                    });
                }
            }

            return await UpdatePostAsync(post);
        }
        private void ValidateAttachmentFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File không hợp lệ");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".pdf", ".doc", ".docx", ".txt" };

            if (!allowedExtensions.Contains(extension))
                throw new ArgumentException($"File type {extension} không được phép");

            if (file.Length > FileConstants.MaxImageSize)
                throw new ArgumentException($"File size vượt quá {FileConstants.MaxImageSize / (1024 * 1024)}MB");
        }
    }
}