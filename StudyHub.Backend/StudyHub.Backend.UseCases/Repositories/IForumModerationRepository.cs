using StudyHub.Backend.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IForumModerationRepository
    {
        Task<ForumRule?> GetRuleByIdAsync(int ruleId);

        Task<(List<ForumRule> rules, int totalCount)> GetRulesBySchoolIdAsync(
            int schoolId,
            string? ruleType = null,
            bool? isActive = null,
            int? pageNumber = null,
            int? pageSize = null);

        Task<List<ForumRule>> GetActiveRulesBySchoolIdAsync(int schoolId);

        Task<ForumRule> CreateRuleAsync(ForumRule rule);
        Task<ForumRule> UpdateRuleAsync(ForumRule rule);
        Task<bool> DeleteRuleAsync(int ruleId);
        Task<bool> ToggleRuleActiveStatusAsync(int ruleId);

        Task<RulePattern?> GetPatternByIdAsync(int patternId);

        Task<(List<RulePattern> patterns, int totalCount)> GetPatternsByRuleIdAsync(
            int ruleId,
            bool? isActive = null,
            int? pageNumber = null,
            int? pageSize = null);

        Task<List<RulePattern>> GetAllActivePatternsForSchoolAsync(int schoolId);

        Task<RulePattern> CreatePatternAsync(RulePattern pattern);
        Task<RulePattern> UpdatePatternAsync(RulePattern pattern);
        Task<bool> DeletePatternAsync(int patternId);
        Task<bool> TogglePatternActiveStatusAsync(int patternId);

        Task<List<(int RuleId, int PatternId, int ViolationScore)>> CheckContentViolationAsync(
            string content,
            int schoolId);

        string NormalizeText(string text);

        Task<UserForumStatus?> GetUserForumStatusAsync(Guid userId, int schoolId);

        Task<(List<UserForumStatus> statuses, int totalCount)> GetUserForumStatusesAsync(
        int schoolId,
        string? query = null,
        bool? isMuted = null,
        int? minViolationScore = null,
        int? maxViolationScore = null,
        string? sortBy = null,
        int? pageNumber = null,
        int? pageSize = null);

        Task<UserForumStatus> CreateOrUpdateUserForumStatusAsync(UserForumStatus status);
        Task<bool> AddViolationScoreAsync(Guid userId, int schoolId, int score);
        Task<bool> ResetViolationScoreAsync(Guid userId, int schoolId);
        Task<bool> MuteUserAsync(Guid userId, int schoolId, DateTime muteUntil);
        Task<bool> UnmuteUserAsync(Guid userId, int schoolId);
        Task<bool> IsUserMutedAsync(Guid userId, int schoolId);

        Task<ViolationRecord?> GetViolationRecordByIdAsync(int recordId);

        Task<(List<ViolationRecord> records, int totalCount)> GetViolationRecordsByUserAsync(
            Guid userId,
            int schoolId,
            DateTime? from = null,
            DateTime? to = null,
            string? sourceType = null,
            int? pageNumber = null,
            int? pageSize = null);

        Task<(List<ViolationRecord> records, int totalCount)> GetViolationRecordsBySchoolAsync(
            int schoolId,
            string? sourceType = null,
            DateTime? from = null,
            DateTime? to = null,
            int? pageNumber = null,
            int? pageSize = null);

        Task<List<ViolationRecord>> GetViolationRecordsByPostIdAsync(int postId);
        Task<List<ViolationRecord>> GetViolationRecordsByCommentIdAsync(int commentId);

        Task<ViolationRecord> CreateViolationRecordAsync(ViolationRecord record);
        Task<bool> SoftDeleteViolationRecordAsync(int recordId);
        Task<int> GetTotalViolationScoreByUserAsync(Guid userId, int schoolId);

        Task<ForumAppeal?> GetAppealByIdAsync(int appealId);

        Task<(List<ForumAppeal> appeals, int totalCount)> GetAppealsByUserAsync(
            Guid userId,
            int schoolId,
            bool? status = null,
            int? pageNumber = null,
            int? pageSize = null);

        Task<(List<ForumAppeal> appeals, int totalCount)> GetAppealsBySchoolAsync(
            int schoolId,
            bool? status = null,
            string? query = null,
            DateTime? createdFrom = null,
            DateTime? createdTo = null,
            int? pageNumber = null,
            int? pageSize = null);

        Task<List<ForumAppeal>> GetPendingAppealsBySchoolAsync(int schoolId);
        Task<bool> ApproveViolationReportAsync(int recordId, Guid moderatorId);
        Task<bool> RejectViolationReportAsync(int recordId, Guid moderatorId);
        Task<ForumAppeal> CreateAppealAsync(ForumAppeal appeal);
        Task<bool> ApproveAppealAsync(int appealId, Guid moderatorId);
        Task<bool> RejectAppealAsync(int appealId, Guid moderatorId);
    }
}