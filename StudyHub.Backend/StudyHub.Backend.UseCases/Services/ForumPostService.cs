using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;
using StudyHub.Backend.UseCases.IServices;

namespace StudyHub.Backend.UseCases.Services
{
    public class ForumPostService
    {
        private readonly IForumPostRepository _postRepo;
        private readonly IForumConfigRepository _configRepo;
        private readonly IForumModerationRepository _moderationRepo;
        private readonly ICloudinaryRepository _fileStorage;
        private readonly IImageModerationService _imageModerationService;

        public ForumPostService(
            IForumPostRepository postRepo,
            IForumConfigRepository configRepo,
            IForumModerationRepository moderationRepo,
            ICloudinaryRepository fileStorage,
            IImageModerationService imageModerationService)
        {
            _postRepo = postRepo;
            _configRepo = configRepo;
            _moderationRepo = moderationRepo;
            _fileStorage = fileStorage;
            _imageModerationService = imageModerationService;
        }

        public async Task<ForumPost?> GetPostByIdAsync(int postId)
        {
            return await _postRepo.GetPostByIdAsync(postId);
        }

        public async Task<(List<ForumPost> posts, int totalCount)> GetPublicPostsAsync(
            int schoolId,
            int? subjectId = null,
            int? flairId = null,
            string? query = null,
            string? sortBy = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            return await _postRepo.GetPublicPostsAsync(
                schoolId, subjectId, flairId, query, sortBy, pageNumber, pageSize);
        }

        public async Task<(List<ForumPost> posts, int totalCount)> GetOwnedPostsAsync(
            Guid userId,
            int schoolId,
            int? subjectId = null,
            int? flairId = null,
            string? query = null,
            bool? status = null,
            DateTime? createdFrom = null,
            DateTime? createdTo = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            return await _postRepo.GetOwnedPostsAsync(
                userId, schoolId, subjectId, flairId, query, status,
                createdFrom, createdTo, pageNumber, pageSize);
        }

        public async Task<(List<ForumPost> posts, int totalCount)> GetModeratorPostsAsync(
            int schoolId,
            int? subjectId = null,
            int? flairId = null,
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
                schoolId, subjectId, flairId, query, postStatus,
                minViolationScore, maxViolationScore, createdFrom, createdTo,
                sortBy, pageNumber, pageSize);
        }

        public async Task<ForumPost> CreatePostAsync(ForumPost post, List<IFormFile>? attachments = null)
        {
            var violations = await _moderationRepo.CheckContentViolationAsync(post.Content, post.SchoolId);

            ForumFlair? flair = null;
            if (post.FlairId.HasValue)
            {
                flair = await _configRepo.GetFlairByIdAsync(post.FlairId.Value);
            }

            bool hasTextViolations = violations.Any();
            bool hasProtectedFlair = flair?.IsProtected ?? false;

            List<ForumAttachment> processedAttachments = new List<ForumAttachment>();
            bool hasImageViolation = false;

            if (attachments != null && attachments.Any())
            {
                var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };

                foreach (var file in attachments)
                {
                    ValidateAttachmentFile(file);

                    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                    bool isImage = imageExtensions.Contains(extension);

                    if (isImage)
                    {
                        try
                        {
                            var moderationResult = await _imageModerationService.ModerateImageFromStreamAsync(file.OpenReadStream());

                            if (moderationResult.IsViolation)
                            {
                                hasImageViolation = true;
                                continue;
                            }
                        }
                        catch (Exception)
                        {
                            throw new InvalidOperationException(
                                "Không thể kiểm duyệt ảnh. Vui lòng thử lại sau.");
                        }
                    }

                    var fileUrl = await _fileStorage.UploadFileAsync(file, FileConstants.ForumPostAttachmentUploadPath);

                    if (string.IsNullOrWhiteSpace(fileUrl))
                    {
                        throw new InvalidOperationException($"Không thể tải lên file {file.FileName}");
                    }

                    processedAttachments.Add(new ForumAttachment
                    {
                        FileUrl = fileUrl,
                        CreatedBy = post.CreatedBy,
                        CreatedAt = DateTime.Now,
                        IsApproved = true
                    });
                }
            }

            if (hasTextViolations)
            {
                foreach (var violation in violations)
                {
                    post.TotalViolationScore += violation.ViolationScore;
                }
            }

            if (hasImageViolation)
            {
                post.TotalViolationScore += 10;
            }

            if (hasTextViolations || hasImageViolation)
            {
                if (hasProtectedFlair)
                {
                    post.Status = null;
                }
                else
                {
                    post.Status = false;
                    post.IsHidden = true;
                    post.Title = "[Bài viết vi phạm]";
                    post.Content = "Nội dung này đã bị ẩn do vi phạm quy định cộng đồng.";
                }
            }
            else
            {
                post.Status = hasProtectedFlair ? true : true;
            }

            var createdPost = await _postRepo.CreatePostAsync(post);

            if (hasTextViolations)
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

                    await _moderationRepo.AddViolationScoreAsync(post.CreatedBy, post.SchoolId, violation.ViolationScore);
                }
            }

            if (hasImageViolation)
            {
                await _moderationRepo.CreateViolationRecordAsync(new ViolationRecord
                {
                    UserId = post.CreatedBy,
                    SchoolId = post.SchoolId,
                    PostId = createdPost.Id,
                    ViolationScore = 10,
                    SourceType = "auto",
                    CreatedAt = DateTime.Now
                });

                await _moderationRepo.AddViolationScoreAsync(post.CreatedBy, post.SchoolId, 10);
            }

            foreach (var attachment in processedAttachments)
            {
                attachment.PostId = createdPost.Id;
                await _configRepo.CreateAttachmentAsync(attachment);
            }

            var userStatus = await _moderationRepo.GetUserForumStatusAsync(post.CreatedBy, post.SchoolId);
            if (userStatus != null && userStatus.TotalViolationScore <= 0)
            {
                await _moderationRepo.MuteUserAsync(post.CreatedBy, post.SchoolId, DateTime.Now.AddDays(7));
            }

            return createdPost;
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
            return await _postRepo.ApprovePostAsync(postId, Guid.Parse(moderatorId));
        }

        public async Task<bool> RejectPostAsync(int postId, string moderatorId)
        {
            var post = await _postRepo.GetPostByIdAsync(postId);
            if (post == null) return false;

            await _moderationRepo.CreateViolationRecordAsync(new ViolationRecord
            {
                UserId = post.CreatedBy,
                SchoolId = post.SchoolId,
                PostId = postId,
                ViolationScore = 5,
                SourceType = "manual",
                CreatedAt = DateTime.Now
            });

            await _moderationRepo.AddViolationScoreAsync(post.CreatedBy, post.SchoolId, 5);

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

            post.IsHidden = true;
            post.Title = "[Bài viết vi phạm]";
            post.Content = "Nội dung này đã bị ẩn do vi phạm quy định cộng đồng.";
            post.Status = false;

            await _postRepo.UpdatePostAsync(post);

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

            return true;
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