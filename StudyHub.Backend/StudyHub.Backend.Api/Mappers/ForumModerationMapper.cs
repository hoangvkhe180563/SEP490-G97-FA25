using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos.ForumDTOs;

namespace StudyHub.Backend.Api.Mappers
{
    public static class ForumModerationMapper
    {

        public static ForumRuleListDto ToListDto(this ForumRule rule)
        {
            return new ForumRuleListDto
            {
                RuleId = rule.Id,
                SchoolId = rule.SchoolId,
                RuleName = rule.Name,
                RuleType = rule.RuleType,
                Severity = rule.Severity,
                ViolationScore = rule.ViolationScore,
                IsActive = rule.IsActive ?? true,
                Description = rule.Description,
                PatternCount = rule.PatternCount,
                CreatedAt = rule.CreatedAt
            };
        }

        public static ForumRuleDetailDto ToDetailDto(this ForumRule rule)
        {
            return new ForumRuleDetailDto
            {
                RuleId = rule.Id,
                SchoolId = rule.SchoolId,
                RuleName = rule.Name,
                RuleType = rule.RuleType,
                Severity = rule.Severity,
                ViolationScore = rule.ViolationScore,
                IsActive = rule.IsActive ?? true,
                Description = rule.Description,
                CreatedAt = rule.CreatedAt,
                UpdatedAt = rule.UpdatedAt,
                Patterns = rule.Patterns?.Select(p => p.ToDto()).ToList()
                    ?? new List<RulePatternDto>()
            };
        }

        public static ForumRule ToEntity(this CreateForumRuleDto dto, Guid createdBy, int schoolId)
        {
            return new ForumRule
            {
                SchoolId = schoolId,
                Name = dto.RuleName,
                RuleType = dto.RuleType,
                Severity = dto.Severity,
                ViolationScore = dto.ViolationScore,
                //IsActive = dto.IsActive ?? true,
                Description = dto.Description,
                CreatedAt = DateTime.Now,
                CreatedBy = createdBy
            };
        }

        public static ForumRule ToEntity(this UpdateForumRuleDto dto, ForumRule existingRule)
        {
            existingRule.Name = dto.RuleName;
            existingRule.RuleType = dto.RuleType;
            existingRule.Severity = dto.Severity;
            existingRule.ViolationScore = dto.ViolationScore;
            existingRule.Description = dto.Description;
            existingRule.UpdatedAt = DateTime.Now;

            return existingRule;
        }

        public static RulePatternDto ToDto(this RulePattern pattern)
        {
            return new RulePatternDto
            {
                PatternId = pattern.Id,
                RuleId = pattern.RuleId,
                Pattern = pattern.Pattern,
                //IsActive = pattern.IsActive,
                CreatedAt = pattern.CreatedAt,
                UpdatedAt = pattern.UpdatedAt
            };
        }

        public static RulePattern ToEntity(this CreateRulePatternDto dto, Guid createdBy)
        {
            return new RulePattern
            {
                RuleId = dto.RuleId,
                Pattern = dto.Pattern,
                //IsActive = dto.IsActive ?? true,
                CreatedAt = DateTime.Now,
                CreatedBy = createdBy
            };
        }

        public static RulePattern ToEntity(this UpdateRulePatternDto dto, RulePattern existingPattern)
        {
            existingPattern.Pattern = dto.Pattern;
            existingPattern.UpdatedAt = DateTime.Now;

            return existingPattern;
        }

        public static ViolationRecordDto ToDto(this ViolationRecord record)
        {
            return new ViolationRecordDto
            {
                RecordId = record.Id,
                UserId = record.UserId,
                Username = record.User?.Username,
                SchoolId = record.SchoolId,
                PostId = record.PostId,
                PostTitle = record.Post?.Title,
                CommentId = record.CommentId,
                MatchedRuleId = record.MatchedRuleId,
                RuleName = record.Rule?.Name,
                MatchedPatternId = record.MatchedPatternId,
                PatternText = record.Pattern?.Pattern,
                ViolationScore = record.ViolationScore,
                SourceType = record.SourceType,
                ReportedBy = record.ReportedBy,
                ReporterName = record.Reporter?.Username,
                CreatedAt = record.CreatedAt
            };
        }

        public static ViolationRecordDto ToDetailDto(this ViolationRecord record)
        {
            return new ViolationRecordDto
            {
                RecordId = record.Id,
                UserId = record.UserId,
                Username = record.User?.Username,
                //UserFullname = record.User?.Fullname,
                SchoolId = record.SchoolId,
                PostId = record.PostId,
                PostTitle = record.Post?.Title,
                CommentId = record.CommentId,
                MatchedRuleId = record.MatchedRuleId,
                RuleName = record.Rule?.Name,
                MatchedPatternId = record.MatchedPatternId,
                PatternText = record.Pattern?.Pattern,
                ViolationScore = record.ViolationScore,
                SourceType = record.SourceType,
                ReportedBy = record.ReportedBy,
                ReporterName = record.Reporter?.Username,
                CreatedAt = record.CreatedAt,
                DeletedAt = record.DeletedAt
            };
        }

        public static UserForumStatusListDto ToDto(this UserForumStatus status)
        {
            return new UserForumStatusListDto
            {
                UserId = status.UserId,
                Username = status.User?.Username,
                Fullname = status.User?.Fullname,
                SchoolId = status.SchoolId,
                TotalViolationScore = status.TotalViolationScore,
                IsMute = status.IsMute,
                MuteUntil = status.MuteUntil,
                CreatedAt = status.CreatedAt,
                UpdatedAt = status.UpdatedAt
            };
        }

        public static ForumAppealListDto ToListDto(this ForumAppeal appeal)
        {
            return new ForumAppealListDto
            {
                AppealId = appeal.Id,
                UserId = appeal.UserId,
                Username = appeal.User?.Username,
                Fullname = appeal.User?.Fullname,
                SchoolId = appeal.SchoolId,
                Reason = appeal.Reason,
                Status = appeal.Status,
                StatusText = appeal.Status ?? true
                    ? "Approved"
                    : (appeal.UpdatedAt.HasValue ? "Rejected" : "Pending"),
                CreatedAt = appeal.CreatedAt,
                UpdatedAt = appeal.UpdatedAt,
                UpdatedBy = appeal.UpdatedBy,
                ModeratorName = null
            };
        }

        public static ForumAppealDetailDto ToDetailDto(this ForumAppeal appeal)
        {
            return new ForumAppealDetailDto
            {
                AppealId = appeal.Id,
                UserId = appeal.UserId,
                Username = appeal.User?.Username,
                Fullname = appeal.User?.Fullname,
                //UserAvatar = appeal.User?.Avatar,
                SchoolId = appeal.SchoolId,
                Reason = appeal.Reason,
                Status = appeal.Status,
                StatusText = appeal.Status ?? true
                    ? "Approved"
                    : (appeal.UpdatedAt.HasValue ? "Rejected" : "Pending"),
                CreatedAt = appeal.CreatedAt,
                UpdatedAt = appeal.UpdatedAt,
                UpdatedBy = appeal.UpdatedBy,
                ModeratorName = null
            };
        }

        public static ForumAppeal ToEntity(this CreateForumAppealDto dto, Guid userId, int schoolId)
        {
            return new ForumAppeal
            {
                UserId = userId,
                SchoolId = schoolId,
                Reason = dto.Reason,
                Status = false,
                CreatedAt = DateTime.Now
            };
        }

    }
}