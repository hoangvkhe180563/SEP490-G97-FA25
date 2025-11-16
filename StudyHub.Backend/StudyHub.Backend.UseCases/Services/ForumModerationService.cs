using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class ForumModerationService
    {
        private readonly IForumModerationRepository _moderationRepo;

        public ForumModerationService(IForumModerationRepository moderationRepo)
        {
            _moderationRepo = moderationRepo;
        }

        public async Task<ForumRule?> GetRuleByIdAsync(int ruleId)
        {
            var rule = await _moderationRepo.GetRuleByIdAsync(ruleId);
            if (rule == null) return null;

            var (patterns, _) = await _moderationRepo.GetPatternsByRuleIdAsync(ruleId);
            rule.Patterns = patterns;

            return rule;
        }

        public async Task<(List<ForumRule> rules, int totalCount)> GetRulesBySchoolAsync(
            int schoolId,
            string? ruleType = null,
            bool? isActive = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            return await _moderationRepo.GetRulesBySchoolIdAsync(
                schoolId, ruleType, isActive, pageNumber, pageSize);
        }

        public async Task<List<ForumRule>> GetActiveRulesBySchoolAsync(int schoolId)
        {
            return await _moderationRepo.GetActiveRulesBySchoolIdAsync(schoolId);
        }

        public async Task<ForumRule> CreateRuleWithPatternsAsync(ForumRule rule, List<string> patterns)
        {
            var createdRule = await _moderationRepo.CreateRuleAsync(rule);

            foreach (var patternText in patterns)
            {
                if (!string.IsNullOrWhiteSpace(patternText))
                {
                    var pattern = new RulePattern
                    {
                        RuleId = createdRule.Id,
                        Pattern = patternText,
                        IsActive = true,
                        CreatedAt = DateTime.Now,
                        CreatedBy = rule.CreatedBy
                    };

                    await _moderationRepo.CreatePatternAsync(pattern);
                }
            }

            return await GetRuleByIdAsync(createdRule.Id);
        }

        public async Task<ForumRule> UpdateRuleAsync(ForumRule rule)
        {
            return await _moderationRepo.UpdateRuleAsync(rule);
        }

        public async Task<bool> DeleteRuleAsync(int ruleId)
        {
            return await _moderationRepo.DeleteRuleAsync(ruleId);
        }

        public async Task<bool> ToggleRuleStatusAsync(int ruleId)
        {
            return await _moderationRepo.ToggleRuleActiveStatusAsync(ruleId);
        }

        public async Task<RulePattern?> GetPatternByIdAsync(int patternId)
        {
            return await _moderationRepo.GetPatternByIdAsync(patternId);
        }

        public async Task<(List<RulePattern> patterns, int totalCount)> GetPatternsByRuleAsync(
            int ruleId,
            bool? isActive = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            return await _moderationRepo.GetPatternsByRuleIdAsync(ruleId, isActive, pageNumber, pageSize);
        }

        public async Task<List<RulePattern>> GetAllActivePatternsForSchoolAsync(int schoolId)
        {
            return await _moderationRepo.GetAllActivePatternsForSchoolAsync(schoolId);
        }

        public async Task<RulePattern> CreatePatternAsync(RulePattern pattern)
        {
            return await _moderationRepo.CreatePatternAsync(pattern);
        }

        public async Task<RulePattern> UpdatePatternAsync(RulePattern pattern)
        {
            return await _moderationRepo.UpdatePatternAsync(pattern);
        }

        public async Task<bool> DeletePatternAsync(int patternId)
        {
            return await _moderationRepo.DeletePatternAsync(patternId);
        }

        public async Task<bool> TogglePatternStatusAsync(int patternId)
        {
            return await _moderationRepo.TogglePatternActiveStatusAsync(patternId);
        }

        public async Task<List<(int RuleId, int PatternId, int ViolationScore)>> CheckContentViolationAsync(
            string content,
            int schoolId)
        {
            return await _moderationRepo.CheckContentViolationAsync(content, schoolId);
        }

        public string NormalizeText(string text)
        {
            return _moderationRepo.NormalizeText(text);
        }

        public async Task<UserForumStatus?> GetUserForumStatusAsync(Guid userId, int schoolId)
        {
            return await _moderationRepo.GetUserForumStatusAsync(userId, schoolId);
        }

        public async Task<(List<UserForumStatus> statuses, int totalCount)> GetMutedUsersAsync(
            int schoolId,
            DateTime? mutedFrom = null,
            DateTime? mutedTo = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            return await _moderationRepo.GetMutedUsersAsync(
                schoolId, mutedFrom, mutedTo, pageNumber, pageSize);
        }

        public async Task<UserForumStatus> CreateOrUpdateUserForumStatusAsync(UserForumStatus status)
        {
            return await _moderationRepo.CreateOrUpdateUserForumStatusAsync(status);
        }

        public async Task<bool> AddViolationScoreAsync(Guid userId, int schoolId, int score)
        {
            return await _moderationRepo.AddViolationScoreAsync(userId, schoolId, score);
        }

        public async Task<bool> ResetViolationScoreAsync(Guid userId, int schoolId)
        {
            return await _moderationRepo.ResetViolationScoreAsync(userId, schoolId);
        }

        public async Task<bool> MuteUserAsync(Guid userId, int schoolId, DateTime muteUntil)
        {
            return await _moderationRepo.MuteUserAsync(userId, schoolId, muteUntil);
        }

        public async Task<bool> UnmuteUserAsync(Guid userId, int schoolId)
        {
            return await _moderationRepo.UnmuteUserAsync(userId, schoolId);
        }

        public async Task<bool> IsUserMutedAsync(string userId, int schoolId)
        {
            return await _moderationRepo.IsUserMutedAsync(Guid.Parse(userId), schoolId);
        }

        public async Task<int> GetTotalViolationScoreByUserAsync(Guid userId, int schoolId)
        {
            return await _moderationRepo.GetTotalViolationScoreByUserAsync(userId, schoolId);
        }

        public async Task<ViolationRecord?> GetViolationRecordByIdAsync(int recordId)
        {
            return await _moderationRepo.GetViolationRecordByIdAsync(recordId);
        }

        public async Task<(List<ViolationRecord> records, int totalCount)> GetViolationRecordsByUserAsync(
            Guid userId,
            int schoolId,
            DateTime? from = null,
            DateTime? to = null,
            string? sourceType = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            return await _moderationRepo.GetViolationRecordsByUserAsync(
                userId, schoolId, from, to, sourceType, pageNumber, pageSize);
        }

        public async Task<(List<ViolationRecord> records, int totalCount)> GetViolationRecordsBySchoolAsync(
            int schoolId,
            string? sourceType = null,
            DateTime? from = null,
            DateTime? to = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            return await _moderationRepo.GetViolationRecordsBySchoolAsync(
                schoolId, sourceType, from, to, pageNumber, pageSize);
        }

        public async Task<List<ViolationRecord>> GetViolationRecordsByPostIdAsync(int postId)
        {
            return await _moderationRepo.GetViolationRecordsByPostIdAsync(postId);
        }

        public async Task<List<ViolationRecord>> GetViolationRecordsByCommentIdAsync(int commentId)
        {
            return await _moderationRepo.GetViolationRecordsByCommentIdAsync(commentId);
        }

        public async Task<ViolationRecord> CreateViolationRecordAsync(ViolationRecord record)
        {
            return await _moderationRepo.CreateViolationRecordAsync(record);
        }

        public async Task<bool> SoftDeleteViolationRecordAsync(int recordId)
        {
            return await _moderationRepo.SoftDeleteViolationRecordAsync(recordId);
        }

        public async Task<ForumAppeal?> GetAppealByIdAsync(int appealId)
        {
            return await _moderationRepo.GetAppealByIdAsync(appealId);
        }

        public async Task<(List<ForumAppeal> appeals, int totalCount)> GetAppealsByUserAsync(
            Guid userId,
            int schoolId,
            bool? status = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            return await _moderationRepo.GetAppealsByUserAsync(userId, schoolId, status, pageNumber, pageSize);
        }

        public async Task<(List<ForumAppeal> appeals, int totalCount)> GetAppealsBySchoolAsync(
            int schoolId,
            bool? status = null,
            string? query = null,
            DateTime? createdFrom = null,
            DateTime? createdTo = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            return await _moderationRepo.GetAppealsBySchoolAsync(
                schoolId, status,query ,createdFrom, createdTo, pageNumber, pageSize);
        }

        public async Task<List<ForumAppeal>> GetPendingAppealsBySchoolAsync(int schoolId)
        {
            return await _moderationRepo.GetPendingAppealsBySchoolAsync(schoolId);
        }

        public async Task<ForumAppeal> CreateAppealAsync(ForumAppeal appeal)
        {
            return await _moderationRepo.CreateAppealAsync(appeal);
        }

        public async Task<bool> ApproveAppealAsync(int appealId, Guid moderatorId)
        {
            return await _moderationRepo.ApproveAppealAsync(appealId, moderatorId);
        }

        public async Task<bool> RejectAppealAsync(int appealId, Guid moderatorId)
        {
            return await _moderationRepo.RejectAppealAsync(appealId, moderatorId);
        }
        public async Task<bool> ApproveReportAsync(int recordId, Guid moderatorId)
        {
            return await _moderationRepo.ApproveViolationReportAsync(recordId, moderatorId);
        }

        public async Task<bool> RejectReportAsync(int recordId, Guid moderatorId)
        {
            return await _moderationRepo.RejectViolationReportAsync(recordId,  moderatorId);
        }
    }
}