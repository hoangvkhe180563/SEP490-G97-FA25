using StudyHub.Backend.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IForumPostRepository
    {
        Task<ForumPost?> GetPostByIdAsync(int postId);

        Task<(List<ForumPost> posts, int totalCount)> GetPublicPostsAsync(
            int schoolId,
            int? subjectId = null,
            int? flairId = null,
            string? query = null,
            string? sortBy = null,
            int? pageNumber = null,
            int? pageSize = null);

        Task<(List<ForumPost> posts, int totalCount)> GetOwnedPostsAsync(
            Guid userId,
            int schoolId,
            int? subjectId = null,
            int? flairId = null,
            string? query = null,
            bool? status = null,
            DateTime? createdFrom = null,
            DateTime? createdTo = null,
            int? pageNumber = null,
            int? pageSize = null);

        Task<(List<ForumPost> posts, int totalCount)> GetModeratorPostsAsync(
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
            int? pageSize = null);

        Task<ForumPost> CreatePostAsync(ForumPost post);
        Task<ForumPost> UpdatePostAsync(ForumPost post);
        Task<bool> SoftDeletePostAsync(int postId, Guid deletedBy);
        Task<bool> ApprovePostAsync(int postId, Guid moderatorId);
        Task<bool> RejectPostAsync(int postId, Guid moderatorId);
        Task<bool> UpdatePostViolationScoreAsync(int postId, int additionalScore);
    }
}