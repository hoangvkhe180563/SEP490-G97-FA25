using StudyHub.Backend.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IForumCommentRepository
    {
        Task<ForumComment?> GetCommentByIdAsync(int commentId);

        Task<(List<ForumComment> comments, int totalCount)> GetCommentsByPostIdAsync(
            int postId,
            int? pageNumber = null,
            int? pageSize = null);

        Task<List<ForumComment>> GetRootCommentsByPostIdAsync(int postId);
        Task<List<ForumComment>> GetRepliesByParentIdAsync(int parentCommentId);

        Task<(List<ForumComment> comments, int totalCount)> GetModeratorCommentsAsync(
            int schoolId,
            int? postId = null,
            string? commentStatus = null,
            int? minViolationScore = null,
            DateTime? createdFrom = null,
            DateTime? createdTo = null,
            int? pageNumber = null,
            int? pageSize = null);

        Task<ForumComment> CreateCommentAsync(ForumComment comment);
        Task<ForumComment> UpdateCommentAsync(ForumComment comment);
        Task<bool> SoftDeleteCommentAsync(int commentId, Guid deletedBy);
        Task<bool> ApproveCommentAsync(int commentId, Guid moderatorId);
        Task<bool> RejectCommentAsync(int commentId, Guid moderatorId);
        Task<bool> UpdateCommentViolationScoreAsync(int commentId, int additionalScore);
    }
}