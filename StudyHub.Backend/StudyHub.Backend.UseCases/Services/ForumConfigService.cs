using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class ForumConfigService
    {
        private readonly IForumConfigRepository _configRepo;

        public ForumConfigService(IForumConfigRepository configRepo)
        {
            _configRepo = configRepo;
        }


        public async Task<ForumFlair?> GetFlairByIdAsync(int flairId)
        {
            return await _configRepo.GetFlairByIdAsync(flairId);
        }

        public async Task<(List<ForumFlair> flairs, int totalCount)> GetFlairsBySchoolAsync(
            int schoolId,
            bool? isProtected = null,
            bool? status = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            return await _configRepo.GetFlairsBySchoolIdAsync(
                schoolId, isProtected, status, pageNumber, pageSize);
        }

        public async Task<List<ForumFlair>> GetActiveFlairsBySchoolAsync(int schoolId)
        {
            return await _configRepo.GetActiveFlairsBySchoolIdAsync(schoolId);
        }

        public async Task<List<ForumFlair>> GetProtectedFlairsBySchoolAsync(int schoolId)
        {
            return await _configRepo.GetProtectedFlairsBySchoolIdAsync(schoolId);
        }

        public async Task<ForumFlair> CreateFlairAsync(ForumFlair flair)
        {
            if (string.IsNullOrWhiteSpace(flair.Name))
                throw new ArgumentException("Flair name is required");

            flair.CreatedAt = DateTime.Now;
            return await _configRepo.CreateFlairAsync(flair);
        }

        public async Task<ForumFlair> UpdateFlairAsync(ForumFlair flair)
        {
            var existing = await _configRepo.GetFlairByIdAsync(flair.Id);
            if (existing == null)
                throw new InvalidOperationException("Flair not found");

            if (string.IsNullOrWhiteSpace(flair.Name))
                throw new ArgumentException("Flair name is required");

            flair.UpdatedAt = DateTime.Now;
            return await _configRepo.UpdateFlairAsync(flair);
        }

        public async Task<bool> DeleteFlairAsync(int flairId)
        {
            var existing = await _configRepo.GetFlairByIdAsync(flairId);
            if (existing == null)
                return false;

            return await _configRepo.DeleteFlairAsync(flairId);
        }

        public async Task<bool> ToggleFlairStatusAsync(int flairId)
        {
            var existing = await _configRepo.GetFlairByIdAsync(flairId);
            if (existing == null)
                return false;

            return await _configRepo.ToggleFlairStatusAsync(flairId);
        }

        public async Task<ForumAttachment?> GetAttachmentByIdAsync(int attachmentId)
        {
            return await _configRepo.GetAttachmentByIdAsync(attachmentId);
        }

        public async Task<List<ForumAttachment>> GetAttachmentsByPostIdAsync(int postId)
        {
            return await _configRepo.GetAttachmentsByPostIdAsync(postId);
        }

        public async Task<List<ForumAttachment>> GetAttachmentsByCommentIdAsync(int commentId)
        {
            return await _configRepo.GetAttachmentsByCommentIdAsync(commentId);
        }

        public async Task<(List<ForumAttachment> attachments, int totalCount)> GetPendingAttachmentsAsync(
            int? pageNumber = null,
            int? pageSize = null)
        {
            return await _configRepo.GetPendingAttachmentsAsync(pageNumber, pageSize);
        }

        public async Task<ForumAttachment> CreateAttachmentAsync(ForumAttachment attachment)
        {
            if (string.IsNullOrWhiteSpace(attachment.FileUrl))
                throw new ArgumentException("File URL is required");

            attachment.CreatedAt = DateTime.Now;
            return await _configRepo.CreateAttachmentAsync(attachment);
        }

        public async Task<bool> SoftDeleteAttachmentAsync(int attachmentId)
        {
            var existing = await _configRepo.GetAttachmentByIdAsync(attachmentId);
            if (existing == null)
                return false;

            return await _configRepo.SoftDeleteAttachmentAsync(attachmentId);
        }

        public async Task<bool> ApproveAttachmentAsync(int attachmentId, Guid approvedBy)
        {
            var existing = await _configRepo.GetAttachmentByIdAsync(attachmentId);
            if (existing == null)
                return false;

            return await _configRepo.ApproveAttachmentAsync(attachmentId, approvedBy);
        }

        public async Task<bool> RejectAttachmentAsync(int attachmentId)
        {
            var existing = await _configRepo.GetAttachmentByIdAsync(attachmentId);
            if (existing == null)
                return false;

            return await _configRepo.RejectAttachmentAsync(attachmentId);
        }

    }
}