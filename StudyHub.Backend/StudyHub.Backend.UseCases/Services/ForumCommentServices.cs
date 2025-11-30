using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;

namespace StudyHub.Backend.UseCases.Services
{
    public class ForumCommentService
    {
        private readonly IForumCommentRepository _commentRepo;
        private readonly IForumConfigRepository _configRepo;
        private readonly IForumModerationRepository _moderationRepo;
        private readonly ICloudinaryRepository _fileStorage;
        private readonly IImageModerationService _imageModerationService;

        public ForumCommentService(
            IForumCommentRepository commentRepo,
            IForumConfigRepository configRepo,
            IForumModerationRepository moderationRepo,
            ICloudinaryRepository fileStorage,
            IImageModerationService imageModerationService)
        {
            _commentRepo = commentRepo;
            _configRepo = configRepo;
            _moderationRepo = moderationRepo;
            _fileStorage = fileStorage;
            _imageModerationService = imageModerationService;
        }

        public async Task<ForumComment?> GetCommentByIdAsync(int commentId)
        {
            return await _commentRepo.GetCommentByIdAsync(commentId);
        }

        public async Task<(List<ForumComment> comments, int totalCount)> GetCommentsByPostIdAsync(
            int postId,
            int? pageNumber = null,
            int? pageSize = null)
        {
            return await _commentRepo.GetCommentsByPostIdAsync(postId, pageNumber, pageSize);
        }

        public async Task<(List<ForumComment> comments, int totalCount)> GetModeratorCommentsAsync(
            int? postId = null,
            string? commentStatus = null,
            int? minViolationScore = null,
            DateTime? createdFrom = null,
            DateTime? createdTo = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            return await _commentRepo.GetModeratorCommentsAsync(
                 postId, commentStatus, minViolationScore,
                createdFrom, createdTo, pageNumber, pageSize);
        }

        public async Task<ForumComment> CreateCommentAsync(ForumComment comment, List<IFormFile>? attachments = null)
        {
            var textViolationsTask = _moderationRepo.CheckContentViolationAsync(comment.Content, comment.SchoolId);

            bool hasImageViolation = false;
            List<ForumAttachment> processedAttachments = new List<ForumAttachment>();

            if (attachments != null && attachments.Any())
            {
                var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };

                var imageFiles = attachments
                    .Where(f => imageExtensions.Contains(Path.GetExtension(f.FileName).ToLowerInvariant()))
                    .ToList();

                foreach (var file in attachments)
                {
                    ValidateAttachmentFile(file);
                }

                Task<List<ImageModerationResult>>? moderationTask = null;
                if (imageFiles.Any())
                {
                    var imageStreams = imageFiles.Select(f => f.OpenReadStream()).ToList();
                    moderationTask = _imageModerationService.ModerateBatchFromStreamsAsync(imageStreams);
                }

                var uploadTask = _fileStorage.UploadFilesAsync(attachments.ToList(), FileConstants.ForumPostAttachmentUploadPath);

                var uploadResults = await uploadTask;

                List<ImageModerationResult>? moderationResults = null;
                if (moderationTask != null)
                {
                    try
                    {
                        moderationResults = await moderationTask;
                        hasImageViolation = moderationResults.Any(r => r.IsViolation);
                    }
                    catch (Exception)
                    {
                        throw new InvalidOperationException("Không thể kiểm duyệt ảnh. Vui lòng thử lại sau.");
                    }
                }

                for (int i = 0; i < attachments.Count; i++)
                {
                    var file = attachments[i];
                    var fileUrl = uploadResults[i];
                    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                    bool isImage = imageExtensions.Contains(extension);
                    bool currentFileViolation = false;

                    if (isImage && moderationResults != null)
                    {
                        var imageIndex = imageFiles.IndexOf(file);
                        if (imageIndex >= 0 && moderationResults[imageIndex].IsViolation)
                        {
                            currentFileViolation = true;
                        }
                    }

                    if (string.IsNullOrWhiteSpace(fileUrl))
                    {
                        throw new InvalidOperationException($"Không thể tải lên file {file.FileName}");
                    }

                    processedAttachments.Add(new ForumAttachment
                    {
                        FileUrl = fileUrl,
                        CreatedBy = comment.CreatedBy,
                        CreatedAt = DateTime.Now,
                        IsApproved = !currentFileViolation
                    });
                }
            }

            var violations = await textViolationsTask;
            bool hasTextViolations = violations.Any();

            if (hasTextViolations)
            {
                foreach (var violation in violations)
                {
                    comment.TotalViolationScore += violation.ViolationScore;
                }
            }

            if (hasImageViolation)
            {
                comment.TotalViolationScore += 10;
            }

            if (hasTextViolations || hasImageViolation)
            {
                comment.Status = false;
                comment.IsHidden = true;
            }
            else
            {
                comment.Status = true;
            }

            var createdComment = await _commentRepo.CreateCommentAsync(comment);

            if (hasTextViolations)
            {
                foreach (var violation in violations)
                {
                    await _moderationRepo.CreateViolationRecordAsync(new ViolationRecord
                    {
                        UserId = comment.CreatedBy,
                        SchoolId = comment.SchoolId,
                        CommentId = createdComment.CommentId,
                        MatchedRuleId = violation.RuleId,
                        MatchedPatternId = violation.PatternId,
                        ViolationScore = violation.ViolationScore,
                        SourceType = "auto",
                        CreatedAt = DateTime.Now
                    });

                    await _moderationRepo.AddViolationScoreAsync(comment.CreatedBy, comment.SchoolId, violation.ViolationScore);
                }
            }

            if (hasImageViolation)
            {
                await _moderationRepo.CreateViolationRecordAsync(new ViolationRecord
                {
                    UserId = comment.CreatedBy,
                    SchoolId = comment.SchoolId,
                    CommentId = createdComment.CommentId,
                    ViolationScore = 10,
                    SourceType = "auto",
                    CreatedAt = DateTime.Now
                });

                await _moderationRepo.AddViolationScoreAsync(comment.CreatedBy, comment.SchoolId, 10);
            }

            foreach (var attachment in processedAttachments)
            {
                attachment.CommentId = createdComment.CommentId;
                await _configRepo.CreateAttachmentAsync(attachment);
            }

            var userStatus = await _moderationRepo.GetUserForumStatusAsync(comment.CreatedBy, comment.SchoolId);
            if (userStatus != null && userStatus.TotalViolationScore <= 0)
            {
                await _moderationRepo.MuteUserAsync(comment.CreatedBy, comment.SchoolId, DateTime.Now.AddDays(7));
            }

            var commentWithDetails = await _commentRepo.GetCommentByIdAsync(createdComment.CommentId);
            return commentWithDetails ?? createdComment;
        }

        public async Task<ForumComment> UpdateCommentAsync(ForumComment comment)
        {
            return await _commentRepo.UpdateCommentAsync(comment);
        }

        public async Task<bool> SoftDeleteCommentAsync(int commentId, Guid deletedBy)
        {
            return await _commentRepo.SoftDeleteCommentAsync(commentId, deletedBy);
        }

        public async Task<bool> ApproveCommentAsync(int commentId, string moderatorId)
        {
            return await _commentRepo.ApproveCommentAsync(commentId, Guid.Parse(moderatorId));
        }

        public async Task<bool> RejectCommentAsync(int commentId, string moderatorId)
        {
            var comment = await _commentRepo.GetCommentByIdAsync(commentId);
            if (comment == null) return false;

            await _moderationRepo.CreateViolationRecordAsync(new ViolationRecord
            {
                UserId = comment.CreatedBy,
                SchoolId = comment.SchoolId,
                CommentId = commentId,
                ViolationScore = 3,
                SourceType = "manual",
                CreatedAt = DateTime.Now
            });

            await _moderationRepo.AddViolationScoreAsync(comment.CreatedBy, comment.SchoolId, 3);

            return await _commentRepo.RejectCommentAsync(commentId, Guid.Parse(moderatorId));
        }

        public async Task<bool> ReportCommentAsync(int commentId, Guid reportedBy, int ruleId, string reason)
        {
            var comment = await _commentRepo.GetCommentByIdAsync(commentId);
            if (comment == null) return false;

            var rule = await _moderationRepo.GetRuleByIdAsync(ruleId);
            if (rule == null) return false;

            await _moderationRepo.CreateViolationRecordAsync(new ViolationRecord
            {
                UserId = comment.CreatedBy,
                SchoolId = comment.SchoolId,
                CommentId = commentId,
                MatchedRuleId = ruleId,
                ViolationScore = 0,
                SourceType = "report",
                ReportedBy = reportedBy,
                CreatedAt = DateTime.Now
            });

            return true;
        }

        public async Task<bool> HideCommentByModeratorAsync(int commentId, Guid moderatorId, int violationScore)
        {
            var comment = await _commentRepo.GetCommentByIdAsync(commentId);
            if (comment == null) return false;

            comment.TotalViolationScore += violationScore;
            comment.IsHidden = true;
            comment.Status = false;

            await _commentRepo.UpdateCommentAsync(comment);

            var attachments = await _configRepo.GetAttachmentsByCommentIdAsync(commentId);
            foreach (var att in attachments.Where(a => a.IsApproved == true))
            {
                await _configRepo.RejectAttachmentAsync(att.Id);
            }

            await _moderationRepo.CreateViolationRecordAsync(new ViolationRecord
            {
                UserId = comment.CreatedBy,
                SchoolId = comment.SchoolId,
                CommentId = commentId,
                ViolationScore = violationScore,
                SourceType = "manual",
                CreatedAt = DateTime.Now
            });

            await _moderationRepo.AddViolationScoreAsync(comment.CreatedBy, comment.SchoolId, violationScore);

            return true;
        }

        public async Task<ForumComment> UpdateCommentWithAttachmentsAsync(ForumComment comment, List<IFormFile>? newAttachments, List<string>? deletedAttachmentUrls)
        {
            if (deletedAttachmentUrls != null && deletedAttachmentUrls.Any())
            {
                var existingAttachments = await _configRepo.GetAttachmentsByCommentIdAsync(comment.CommentId);

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
                        CommentId = comment.CommentId,
                        FileUrl = fileUrl,
                        CreatedBy = comment.UpdatedBy ?? comment.CreatedBy,
                        CreatedAt = DateTime.Now,
                        IsApproved = true
                    });
                }
            }

            return await UpdateCommentAsync(comment);
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