//using StudyHub.Backend.Domain.Entities;
//using System;
//using System.Collections.Generic;

//namespace StudyHub.Backend.UseCases.Repositories
//{
//    public interface IForumRepository
//    {
//        Task<ForumPost?> GetPostByIdAsync(int postId);

//        Task<(List<ForumPost> posts, int totalCount)> GetPublicPostsAsync(
//            int schoolId,
//            int? subjectId = null,
//            int? flairId = null,
//            string? query = null,
//            string? sortBy = null,
//            int? pageNumber = null,
//            int? pageSize = null);

//        Task<(List<ForumPost> posts, int totalCount)> GetOwnedPostsAsync(
//            Guid userId,
//            int schoolId,
//            int? subjectId = null,
//            int? flairId = null,
//            string? query = null,
//            bool? status = null,
//            DateTime? createdFrom = null,
//            DateTime? createdTo = null,
//            int? pageNumber = null,
//            int? pageSize = null);

//        Task<(List<ForumPost> posts, int totalCount)> GetModeratorPostsAsync(
//            int schoolId,
//            int? subjectId = null,
//            int? flairId = null,
//            string? query = null,
//            string? postStatus = null,
//            int? minViolationScore = null,
//            int? maxViolationScore = null,
//            DateTime? createdFrom = null,
//            DateTime? createdTo = null,
//            string? sortBy = null,
//            int? pageNumber = null,
//            int? pageSize = null);

//        Task<ForumPost> CreatePostAsync(ForumPost post);
//        Task<ForumPost> UpdatePostAsync(ForumPost post);
//        Task<bool> SoftDeletePostAsync(int postId, Guid deletedBy);
//        Task<bool> ApprovePostAsync(int postId, Guid moderatorId);
//        Task<bool> RejectPostAsync(int postId, Guid moderatorId);
//        Task<bool> UpdatePostViolationScoreAsync(int postId, int additionalScore);

//        Task<ForumComment?> GetCommentByIdAsync(int commentId);

//        Task<(List<ForumComment> comments, int totalCount)> GetCommentsByPostIdAsync(
//            int postId,
//            int? pageNumber = null,
//            int? pageSize = null);

//        Task<List<ForumComment>> GetRootCommentsByPostIdAsync(int postId);

//        Task<List<ForumComment>> GetRepliesByParentIdAsync(int parentCommentId);

//        Task<(List<ForumComment> comments, int totalCount)> GetModeratorCommentsAsync(
//            int schoolId,
//            int? postId = null,
//            string? commentStatus = null,
//            int? minViolationScore = null,
//            DateTime? createdFrom = null,
//            DateTime? createdTo = null,
//            int? pageNumber = null,
//            int? pageSize = null);

//        Task<ForumComment> CreateCommentAsync(ForumComment comment);
//        Task<ForumComment> UpdateCommentAsync(ForumComment comment);
//        Task<bool> SoftDeleteCommentAsync(int commentId, Guid deletedBy);
//        Task<bool> ApproveCommentAsync(int commentId, Guid moderatorId);
//        Task<bool> RejectCommentAsync(int commentId, Guid moderatorId);
//        Task<bool> UpdateCommentViolationScoreAsync(int commentId, int additionalScore);

//        Task<ForumRule?> GetRuleByIdAsync(int ruleId);

//        Task<(List<ForumRule> rules, int totalCount)> GetRulesBySchoolIdAsync(
//            int schoolId,
//            string? ruleType = null,
//            bool? isActive = null,
//            int? pageNumber = null,
//            int? pageSize = null);

//        Task<List<ForumRule>> GetActiveRulesBySchoolIdAsync(int schoolId);

//        Task<ForumRule> CreateRuleAsync(ForumRule rule);
//        Task<ForumRule> UpdateRuleAsync(ForumRule rule);
//        Task<bool> DeleteRuleAsync(int ruleId);
//        Task<bool> ToggleRuleActiveStatusAsync(int ruleId);

//        Task<RulePattern?> GetPatternByIdAsync(int patternId);

//        Task<(List<RulePattern> patterns, int totalCount)> GetPatternsByRuleIdAsync(
//            int ruleId,
//            bool? isActive = null,
//            int? pageNumber = null,
//            int? pageSize = null);

//        Task<List<RulePattern>> GetAllActivePatternsForSchoolAsync(int schoolId);

//        Task<RulePattern> CreatePatternAsync(RulePattern pattern);
//        Task<RulePattern> UpdatePatternAsync(RulePattern pattern);
//        Task<bool> DeletePatternAsync(int patternId);
//        Task<bool> TogglePatternActiveStatusAsync(int patternId);


//        Task<UserForumStatus?> GetUserForumStatusAsync(Guid userId, int schoolId);

//        Task<(List<UserForumStatus> statuses, int totalCount)> GetMutedUsersAsync(
//            int schoolId,
//            DateTime? mutedFrom = null,
//            DateTime? mutedTo = null,
//            int? pageNumber = null,
//            int? pageSize = null);

//        Task<UserForumStatus> CreateOrUpdateUserForumStatusAsync(UserForumStatus status);
//        Task<bool> AddViolationScoreAsync(Guid userId, int schoolId, int score);
//        Task<bool> ResetViolationScoreAsync(Guid userId, int schoolId);
//        Task<bool> MuteUserAsync(Guid userId, int schoolId, DateTime muteUntil);
//        Task<bool> UnmuteUserAsync(Guid userId, int schoolId);
//        Task<bool> IsUserMutedAsync(Guid userId, int schoolId);

//        Task<ForumFlair?> GetFlairByIdAsync(int flairId);

//        Task<(List<ForumFlair> flairs, int totalCount)> GetFlairsBySchoolIdAsync(
//            int schoolId,
//            bool? isProtected = null,
//            bool? status = null,
//            int? pageNumber = null,
//            int? pageSize = null);

//        Task<List<ForumFlair>> GetActiveFlairsBySchoolIdAsync(int schoolId);
//        Task<List<ForumFlair>> GetProtectedFlairsBySchoolIdAsync(int schoolId);

//        Task<ForumFlair> CreateFlairAsync(ForumFlair flair);
//        Task<ForumFlair> UpdateFlairAsync(ForumFlair flair);
//        Task<bool> DeleteFlairAsync(int flairId);
//        Task<bool> ToggleFlairStatusAsync(int flairId);

//        Task<ViolationRecord?> GetViolationRecordByIdAsync(int recordId);

//        Task<(List<ViolationRecord> records, int totalCount)> GetViolationRecordsByUserAsync(
//            Guid userId,
//            int schoolId,
//            DateTime? from = null,
//            DateTime? to = null,
//            string? sourceType = null,
//            int? pageNumber = null,
//            int? pageSize = null);

//        Task<(List<ViolationRecord> records, int totalCount)> GetViolationRecordsBySchoolAsync(
//            int schoolId,
//            string? sourceType = null,
//            DateTime? from = null,
//            DateTime? to = null,
//            int? pageNumber = null,
//            int? pageSize = null);

//        Task<List<ViolationRecord>> GetViolationRecordsByPostIdAsync(int postId);
//        Task<List<ViolationRecord>> GetViolationRecordsByCommentIdAsync(int commentId);

//        Task<ViolationRecord> CreateViolationRecordAsync(ViolationRecord record);
//        Task<bool> SoftDeleteViolationRecordAsync(int recordId);
//        Task<int> GetTotalViolationScoreByUserAsync(Guid userId, int schoolId);


//        Task<ForumAppeal?> GetAppealByIdAsync(int appealId);

//        Task<(List<ForumAppeal> appeals, int totalCount)> GetAppealsByUserAsync(
//            Guid userId,
//            int schoolId,
//            bool? status = null,
//            int? pageNumber = null,
//            int? pageSize = null);

//        Task<(List<ForumAppeal> appeals, int totalCount)> GetAppealsBySchoolAsync(
//            int schoolId,
//            bool? status = null,
//            DateTime? createdFrom = null,
//            DateTime? createdTo = null,
//            int? pageNumber = null,
//            int? pageSize = null);

//        Task<List<ForumAppeal>> GetPendingAppealsBySchoolAsync(int schoolId);

//        Task<ForumAppeal> CreateAppealAsync(ForumAppeal appeal);
//        Task<bool> ApproveAppealAsync(int appealId, Guid moderatorId);
//        Task<bool> RejectAppealAsync(int appealId, Guid moderatorId);

//        Task<ForumAttachment?> GetAttachmentByIdAsync(int attachmentId);

//        Task<List<ForumAttachment>> GetAttachmentsByPostIdAsync(int postId);
//        Task<List<ForumAttachment>> GetAttachmentsByCommentIdAsync(int commentId);

//        Task<(List<ForumAttachment> attachments, int totalCount)> GetPendingAttachmentsAsync(
//            int? pageNumber = null,
//            int? pageSize = null);

//        Task<ForumAttachment> CreateAttachmentAsync(ForumAttachment attachment);
//        Task<bool> SoftDeleteAttachmentAsync(int attachmentId);
//        Task<bool> ApproveAttachmentAsync(int attachmentId, Guid approvedBy);
//        Task<bool> RejectAttachmentAsync(int attachmentId);

//        Task<List<(int RuleId, int PatternId, int ViolationScore)>> CheckContentViolationAsync(
//            string content,
//            int schoolId);

//        string NormalizeText(string text);

//    }
//}