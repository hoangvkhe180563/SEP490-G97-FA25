using StudyHub.Backend.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IForumConfigRepository
    {
        Task<ForumFlair?> GetFlairByIdAsync(int flairId);

        Task<(List<ForumFlair> flairs, int totalCount)> GetFlairsBySchoolIdAsync(
            int schoolId,
            bool? isProtected = null,
            bool? status = null,
            int? pageNumber = null,
            int? pageSize = null);

        Task<List<ForumFlair>> GetActiveFlairsBySchoolIdAsync(int schoolId);
        Task<List<ForumFlair>> GetProtectedFlairsBySchoolIdAsync(int schoolId);

        Task<ForumFlair> CreateFlairAsync(ForumFlair flair);
        Task<ForumFlair> UpdateFlairAsync(ForumFlair flair);
        Task<bool> DeleteFlairAsync(int flairId);
        Task<bool> ToggleFlairStatusAsync(int flairId);

        Task<ForumAttachment?> GetAttachmentByIdAsync(int attachmentId);

        Task<List<ForumAttachment>> GetAttachmentsByPostIdAsync(int postId);
        Task<List<ForumAttachment>> GetAttachmentsByCommentIdAsync(int commentId);

        Task<(List<ForumAttachment> attachments, int totalCount)> GetPendingAttachmentsAsync(
            int? pageNumber = null,
            int? pageSize = null);

        Task<ForumAttachment> CreateAttachmentAsync(ForumAttachment attachment);
        Task<bool> SoftDeleteAttachmentAsync(int attachmentId);
        Task<bool> ApproveAttachmentAsync(int attachmentId, Guid approvedBy);
        Task<bool> RejectAttachmentAsync(int attachmentId);
    }
}