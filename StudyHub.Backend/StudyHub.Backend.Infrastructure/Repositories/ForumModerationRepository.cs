using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class ForumModerationRepository : IForumModerationRepository
    {
        private readonly Data.AppDbContext _context;

        public ForumModerationRepository(Data.AppDbContext context)
        {
            _context = context;
        }

        public async Task<ForumRule?> GetRuleByIdAsync(int ruleId)
        {
            try
            {
                var rule = await _context.ForumRules
                    .FirstOrDefaultAsync(r => r.Id == ruleId);

                if (rule == null) return null;

                return MapRuleToEntity(rule);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetRuleByIdAsync failed: " + ex.Message).LogError();
                return null;
            }
        }

        public async Task<(List<ForumRule> rules, int totalCount)> GetRulesBySchoolIdAsync(
            int schoolId,
            string? ruleType = null,
            bool? isActive = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.ForumRules
                    .Where(r => r.SchoolId == schoolId);

                if (!string.IsNullOrWhiteSpace(ruleType))
                    dbQuery = dbQuery.Where(r => r.RuleType == ruleType);

                if (isActive.HasValue)
                    dbQuery = dbQuery.Where(r => r.IsActive == isActive.Value);

                var totalCount = await dbQuery.CountAsync();

                dbQuery = dbQuery.OrderByDescending(r => r.CreatedAt);

                if (pageNumber.HasValue && pageSize.HasValue)
                    dbQuery = dbQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);

                var rules = await dbQuery.ToListAsync();
                var result = rules.Select(r => MapRuleToEntity(r)).ToList();

                foreach (var rule in result)
                {
                    rule.PatternCount = await _context.RulePatterns
                        .CountAsync(p => p.RuleId == rule.Id);
                }

                return (result, totalCount);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetRulesBySchoolIdAsync failed: " + ex.Message).LogError();
                return (new List<ForumRule>(), 0);
            }
        }

        public async Task<List<ForumRule>> GetActiveRulesBySchoolIdAsync(int schoolId)
        {
            try
            {
                var rules = await _context.ForumRules
                    .Where(r => r.SchoolId == schoolId && r.IsActive == true)
                    .ToListAsync();

                return rules.Select(r => MapRuleToEntity(r)).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetActiveRulesBySchoolIdAsync failed: " + ex.Message).LogError();
                return new List<ForumRule>();
            }
        }

        public async Task<ForumRule> CreateRuleAsync(ForumRule rule)
        {
            try
            {
                var entity = new Data.ForumRule
                {
                    SchoolId = rule.SchoolId,
                    Name = rule.Name,
                    RuleType = rule.RuleType,
                    Severity = rule.Severity,
                    ViolationScore = rule.ViolationScore,
                    IsActive = rule.IsActive,
                    Description = rule.Description,
                    CreatedAt = rule.CreatedAt,
                    CreatedBy = rule.CreatedBy ?? Guid.Empty
                };

                _context.ForumRules.Add(entity);
                await _context.SaveChangesAsync();

                rule.Id = entity.Id;
                return rule;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "CreateRuleAsync failed: " + ex.Message).LogError();
                throw;
            }
        }

        public async Task<ForumRule> UpdateRuleAsync(ForumRule rule)
        {
            try
            {
                var entity = await _context.ForumRules.FindAsync(rule.Id);
                if (entity == null)
                    throw new InvalidOperationException("Rule not found");

                entity.Name = rule.Name;
                entity.RuleType = rule.RuleType;
                entity.Severity = rule.Severity;
                entity.ViolationScore = rule.ViolationScore;
                entity.Description = rule.Description;
                entity.UpdatedAt = DateTime.Now;
                entity.UpdatedBy = rule.UpdatedBy;

                await _context.SaveChangesAsync();
                return rule;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "UpdateRuleAsync failed: " + ex.Message).LogError();
                throw;
            }
        }

        public async Task<bool> DeleteRuleAsync(int ruleId)
        {
            try
            {
                var entity = await _context.ForumRules.FindAsync(ruleId);
                if (entity == null) return false;

                _context.ForumRules.Remove(entity);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "DeleteRuleAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<bool> ToggleRuleActiveStatusAsync(int ruleId)
        {
            try
            {
                var entity = await _context.ForumRules.FindAsync(ruleId);
                if (entity == null) return false;

                entity.IsActive = !entity.IsActive;
                entity.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "ToggleRuleActiveStatusAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<RulePattern?> GetPatternByIdAsync(int patternId)
        {
            try
            {
                var pattern = await _context.RulePatterns
                    .FirstOrDefaultAsync(p => p.Id == patternId);

                if (pattern == null) return null;

                return MapPatternToEntity(pattern);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetPatternByIdAsync failed: " + ex.Message).LogError();
                return null;
            }
        }

        public async Task<(List<RulePattern> patterns, int totalCount)> GetPatternsByRuleIdAsync(
            int ruleId,
            bool? isActive = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.RulePatterns
                    .Where(p => p.RuleId == ruleId);

                if (isActive.HasValue)
                    dbQuery = dbQuery.Where(p => p.IsActive == isActive.Value);

                var totalCount = await dbQuery.CountAsync();

                dbQuery = dbQuery.OrderByDescending(p => p.CreatedAt);

                if (pageNumber.HasValue && pageSize.HasValue)
                    dbQuery = dbQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);

                var patterns = await dbQuery.ToListAsync();
                var result = patterns.Select(p => MapPatternToEntity(p)).ToList();

                return (result, totalCount);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetPatternsByRuleIdAsync failed: " + ex.Message).LogError();
                return (new List<RulePattern>(), 0);
            }
        }

        public async Task<List<RulePattern>> GetAllActivePatternsForSchoolAsync(int schoolId)
        {
            try
            {
                var patterns = await _context.RulePatterns
                    .Include(p => p.Rule)
                    .Where(p => p.Rule.SchoolId == schoolId && p.IsActive == true && p.Rule.IsActive == true)
                    .ToListAsync();

                return patterns.Select(p => MapPatternToEntity(p)).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetAllActivePatternsForSchoolAsync failed: " + ex.Message).LogError();
                return new List<RulePattern>();
            }
        }

        public async Task<RulePattern> CreatePatternAsync(RulePattern pattern)
        {
            try
            {
                var entity = new Data.RulePattern
                {
                    RuleId = pattern.RuleId,
                    Pattern = pattern.Pattern,
                    IsActive = pattern.IsActive,
                    CreatedAt = pattern.CreatedAt,
                    CreatedBy = pattern.CreatedBy ?? Guid.Empty
                };

                _context.RulePatterns.Add(entity);
                await _context.SaveChangesAsync();

                pattern.Id = entity.Id;
                return pattern;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "CreatePatternAsync failed: " + ex.Message).LogError();
                throw;
            }
        }

        public async Task<RulePattern> UpdatePatternAsync(RulePattern pattern)
        {
            try
            {
                var entity = await _context.RulePatterns.FindAsync(pattern.Id);
                if (entity == null)
                    throw new InvalidOperationException("Pattern not found");

                entity.Pattern = pattern.Pattern;
                entity.UpdatedAt = DateTime.Now;
                entity.UpdatedBy = pattern.UpdatedBy;

                await _context.SaveChangesAsync();
                return pattern;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "UpdatePatternAsync failed: " + ex.Message).LogError();
                throw;
            }
        }

        public async Task<bool> DeletePatternAsync(int patternId)
        {
            try
            {
                var entity = await _context.RulePatterns.FindAsync(patternId);
                if (entity == null) return false;

                _context.RulePatterns.Remove(entity);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "DeletePatternAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<bool> TogglePatternActiveStatusAsync(int patternId)
        {
            try
            {
                var entity = await _context.RulePatterns.FindAsync(patternId);
                if (entity == null) return false;

                entity.IsActive = !entity.IsActive;
                entity.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "TogglePatternActiveStatusAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<List<(int RuleId, int PatternId, int ViolationScore)>> CheckContentViolationAsync(
            string content,
            int schoolId)
        {
            try
            {
                var violations = new List<(int RuleId, int PatternId, int ViolationScore)>();
                var normalizedContent = NormalizeText(content);

                var patterns = await _context.RulePatterns
                    .Include(p => p.Rule)
                    .Where(p => p.Rule.SchoolId == schoolId && p.IsActive == true && p.Rule.IsActive == true)
                    .ToListAsync();

                foreach (var pattern in patterns)
                {
                    var normalizedPattern = NormalizeText(pattern.Pattern);

                    if (normalizedContent.Contains(normalizedPattern))
                    {
                        violations.Add((pattern.RuleId, pattern.Id, pattern.Rule.ViolationScore));
                    }
                }

                return violations;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "CheckContentViolationAsync failed: " + ex.Message).LogError();
                return new List<(int, int, int)>();
            }
        }

        public string NormalizeText(string text)
        {
            if (string.IsNullOrEmpty(text))
                return string.Empty;

            text = text.ToLowerInvariant();
            text = Regex.Replace(text, @"[^\w\s]", "");
            text = Regex.Replace(text, @"\s+", "");
            text = RemoveDiacritics(text);

            return text;
        }

        public async Task<UserForumStatus?> GetUserForumStatusAsync(Guid userId, int schoolId)
        {
            try
            {
                var status = await _context.UserForumStatuses
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.SchoolId == schoolId);

                if (status == null) return null;

                return MapUserForumStatusToEntity(status);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetUserForumStatusAsync failed: " + ex.Message).LogError();
                return null;
            }
        }

        public async Task<(List<UserForumStatus> statuses, int totalCount)> GetMutedUsersAsync(
            int schoolId,
            DateTime? mutedFrom = null,
            DateTime? mutedTo = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.UserForumStatuses
                    .Include(s => s.User)
                    .Where(s => s.SchoolId == schoolId && s.IsMute == true);

                if (mutedFrom.HasValue)
                    dbQuery = dbQuery.Where(s => s.MuteUntil >= mutedFrom.Value);

                if (mutedTo.HasValue)
                    dbQuery = dbQuery.Where(s => s.MuteUntil <= mutedTo.Value);

                var totalCount = await dbQuery.CountAsync();

                dbQuery = dbQuery.OrderByDescending(s => s.UpdatedAt);

                if (pageNumber.HasValue && pageSize.HasValue)
                    dbQuery = dbQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);

                var statuses = await dbQuery.ToListAsync();
                var result = statuses.Select(s => MapUserForumStatusToEntity(s)).ToList();

                return (result, totalCount);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetMutedUsersAsync failed: " + ex.Message).LogError();
                return (new List<UserForumStatus>(), 0);
            }
        }

        public async Task<UserForumStatus> CreateOrUpdateUserForumStatusAsync(UserForumStatus status)
        {
            try
            {
                var existing = await _context.UserForumStatuses
                    .FirstOrDefaultAsync(s => s.UserId == status.UserId && s.SchoolId == status.SchoolId);

                if (existing != null)
                {
                    existing.TotalViolationScore = status.TotalViolationScore;
                    existing.IsMute = status.IsMute;
                    existing.MuteUntil = status.MuteUntil;
                    existing.UpdatedAt = DateTime.Now;
                }
                else
                {
                    var entity = new Data.UserForumStatus
                    {
                        UserId = status.UserId,
                        SchoolId = status.SchoolId,
                        TotalViolationScore = status.TotalViolationScore,
                        IsMute = status.IsMute,
                        MuteUntil = status.MuteUntil,
                        CreatedAt = DateTime.Now
                    };

                    _context.UserForumStatuses.Add(entity);
                }

                await _context.SaveChangesAsync();
                return status;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "CreateOrUpdateUserForumStatusAsync failed: " + ex.Message).LogError();
                throw;
            }
        }

        public async Task<bool> AddViolationScoreAsync(Guid userId, int schoolId, int score)
        {
            try
            {
                var status = await _context.UserForumStatuses
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.SchoolId == schoolId);

                if (status == null)
                {
                    status = new Data.UserForumStatus
                    {
                        UserId = userId,
                        SchoolId = schoolId,
                        TotalViolationScore = 50 - score,
                        IsMute = false,
                        CreatedAt = DateTime.Now
                    };
                    _context.UserForumStatuses.Add(status);
                }
                else
                {
                    status.TotalViolationScore -= score;
                    status.UpdatedAt = DateTime.Now;
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "AddViolationScoreAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<bool> ResetViolationScoreAsync(Guid userId, int schoolId)
        {
            try
            {
                var status = await _context.UserForumStatuses
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.SchoolId == schoolId);

                if (status == null) return false;

                status.TotalViolationScore = 50;
                status.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "ResetViolationScoreAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<bool> MuteUserAsync(Guid userId, int schoolId, DateTime muteUntil)
        {
            try
            {
                var status = await _context.UserForumStatuses
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.SchoolId == schoolId);

                if (status == null)
                {
                    status = new Data.UserForumStatus
                    {
                        UserId = userId,
                        SchoolId = schoolId,
                        TotalViolationScore = 0,
                        IsMute = true,
                        MuteUntil = muteUntil,
                        CreatedAt = DateTime.Now
                    };
                    _context.UserForumStatuses.Add(status);
                }
                else
                {
                    status.IsMute = true;
                    status.MuteUntil = muteUntil;
                    status.UpdatedAt = DateTime.Now;
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "MuteUserAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<bool> UnmuteUserAsync(Guid userId, int schoolId)
        {
            try
            {
                var status = await _context.UserForumStatuses
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.SchoolId == schoolId);

                if (status == null) return false;

                status.IsMute = false;
                status.MuteUntil = null;
                status.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "UnmuteUserAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<bool> IsUserMutedAsync(Guid userId, int schoolId)
        {
            try
            {
                var status = await _context.UserForumStatuses
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.SchoolId == schoolId);

                if (status == null) return false;

                if (status.IsMute && status.MuteUntil.HasValue && status.MuteUntil.Value < DateTime.Now)
                {
                    status.IsMute = false;
                    status.MuteUntil = null;
                    status.UpdatedAt = DateTime.Now;
                    await _context.SaveChangesAsync();
                    return false;
                }

                return status.IsMute;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "IsUserMutedAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<ViolationRecord?> GetViolationRecordByIdAsync(int recordId)
        {
            try
            {
                var record = await _context.ViolationRecords
                    .Include(r => r.User)
                    .Include(r => r.Post)
                    .Include(r => r.MatchedRule)
                    .Include(r => r.MatchedPattern)
                    .FirstOrDefaultAsync(r => r.Id == recordId);

                if (record == null) return null;

                return MapViolationRecordToEntity(record);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetViolationRecordByIdAsync failed: " + ex.Message).LogError();
                return null;
            }
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
            try
            {
                var dbQuery = _context.ViolationRecords
                    .Include(r => r.User)
                    .Include(r => r.Post)
                    .Include(r => r.MatchedRule)
                    .Include(r => r.MatchedPattern)
                    .Where(r => r.UserId == userId && r.SchoolId == schoolId && r.DeletedAt == null);

                if (from.HasValue)
                    dbQuery = dbQuery.Where(r => r.CreatedAt >= from.Value);

                if (to.HasValue)
                    dbQuery = dbQuery.Where(r => r.CreatedAt <= to.Value);

                if (!string.IsNullOrWhiteSpace(sourceType))
                    dbQuery = dbQuery.Where(r => r.SourceType == sourceType);

                var totalCount = await dbQuery.CountAsync();

                dbQuery = dbQuery.OrderByDescending(r => r.CreatedAt);

                if (pageNumber.HasValue && pageSize.HasValue)
                    dbQuery = dbQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);

                var records = await dbQuery.ToListAsync();
                var result = records.Select(r => MapViolationRecordToEntity(r)).ToList();

                return (result, totalCount);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetViolationRecordsByUserAsync failed: " + ex.Message).LogError();
                return (new List<ViolationRecord>(), 0);
            }
        }

        public async Task<(List<ViolationRecord> records, int totalCount)> GetViolationRecordsBySchoolAsync(
            int schoolId,
            string? sourceType = null,
            DateTime? from = null,
            DateTime? to = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.ViolationRecords
                    .Include(r => r.User)
                    .Include(r => r.Post)
                    .Include(r => r.MatchedRule)
                    .Include(r => r.MatchedPattern)
                    .Where(r => r.SchoolId == schoolId && r.DeletedAt == null);

                if (!string.IsNullOrWhiteSpace(sourceType))
                    dbQuery = dbQuery.Where(r => r.SourceType == sourceType);

                if (from.HasValue)
                    dbQuery = dbQuery.Where(r => r.CreatedAt >= from.Value);

                if (to.HasValue)
                    dbQuery = dbQuery.Where(r => r.CreatedAt <= to.Value);

                var totalCount = await dbQuery.CountAsync();

                dbQuery = dbQuery.OrderByDescending(r => r.CreatedAt);

                if (pageNumber.HasValue && pageSize.HasValue)
                    dbQuery = dbQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);

                var records = await dbQuery.ToListAsync();
                var result = records.Select(r => MapViolationRecordToEntity(r)).ToList();

                return (result, totalCount);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetViolationRecordsBySchoolAsync failed: " + ex.Message).LogError();
                return (new List<ViolationRecord>(), 0);
            }
        }

        public async Task<List<ViolationRecord>> GetViolationRecordsByPostIdAsync(int postId)
        {
            try
            {
                var records = await _context.ViolationRecords
                    .Include(r => r.User)
                    .Include(r => r.MatchedRule)
                    .Include(r => r.MatchedPattern)
                    .Where(r => r.PostId == postId && r.DeletedAt == null)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                return records.Select(r => MapViolationRecordToEntity(r)).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetViolationRecordsByPostIdAsync failed: " + ex.Message).LogError();
                return new List<ViolationRecord>();
            }
        }

        public async Task<List<ViolationRecord>> GetViolationRecordsByCommentIdAsync(int commentId)
        {
            try
            {
                var records = await _context.ViolationRecords
                    .Include(r => r.User)
                    .Include(r => r.MatchedRule)
                    .Include(r => r.MatchedPattern)
                    .Where(r => r.CommentId == commentId && r.DeletedAt == null)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                return records.Select(r => MapViolationRecordToEntity(r)).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetViolationRecordsByCommentIdAsync failed: " + ex.Message).LogError();
                return new List<ViolationRecord>();
            }
        }

        public async Task<ViolationRecord> CreateViolationRecordAsync(ViolationRecord record)
        {
            try
            {
                var entity = new Data.ViolationRecord
                {
                    UserId = record.UserId,
                    SchoolId = record.SchoolId,
                    PostId = record.PostId,
                    CommentId = record.CommentId,
                    MatchedRuleId = record.MatchedRuleId,
                    MatchedPatternId = record.MatchedPatternId,
                    ViolationScore = record.ViolationScore,
                    SourceType = record.SourceType,
                    ReportedBy = record.ReportedBy,
                    CreatedAt = record.CreatedAt
                };

                _context.ViolationRecords.Add(entity);
                await _context.SaveChangesAsync();

                record.Id = entity.Id;
                return record;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "CreateViolationRecordAsync failed: " + ex.Message).LogError();
                throw;
            }
        }

        public async Task<bool> SoftDeleteViolationRecordAsync(int recordId)
        {
            try
            {
                var entity = await _context.ViolationRecords.FindAsync(recordId);
                if (entity == null) return false;

                entity.DeletedAt = DateTime.Now;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "SoftDeleteViolationRecordAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<int> GetTotalViolationScoreByUserAsync(Guid userId, int schoolId)
        {
            try
            {
                var status = await _context.UserForumStatuses
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.SchoolId == schoolId);

                return status?.TotalViolationScore ?? 50;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetTotalViolationScoreByUserAsync failed: " + ex.Message).LogError();
                return 50;
            }
        }

        public async Task<ForumAppeal?> GetAppealByIdAsync(int appealId)
        {
            try
            {
                var appeal = await _context.ForumAppeals
                    .Include(a => a.User)
                    .FirstOrDefaultAsync(a => a.Id == appealId);

                if (appeal == null) return null;

                return MapAppealToEntity(appeal);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetAppealByIdAsync failed: " + ex.Message).LogError();
                return null;
            }
        }

        public async Task<(List<ForumAppeal> appeals, int totalCount)> GetAppealsByUserAsync(
            Guid userId,
            int schoolId,
            bool? status = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.ForumAppeals
                    .Include(a => a.User)
                    .Where(a => a.UserId == userId && a.SchoolId == schoolId);

                if (status.HasValue)
                    dbQuery = dbQuery.Where(a => a.Status == status.Value);

                var totalCount = await dbQuery.CountAsync();

                dbQuery = dbQuery.OrderByDescending(a => a.CreatedAt);

                if (pageNumber.HasValue && pageSize.HasValue)
                    dbQuery = dbQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);

                var appeals = await dbQuery.ToListAsync();
                var result = appeals.Select(a => MapAppealToEntity(a)).ToList();

                return (result, totalCount);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetAppealsByUserAsync failed: " + ex.Message).LogError();
                return (new List<ForumAppeal>(), 0);
            }
        }

        public async Task<(List<ForumAppeal> appeals, int totalCount)> GetAppealsBySchoolAsync(
            int schoolId,
            bool? status = null,
            DateTime? createdFrom = null,
            DateTime? createdTo = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.ForumAppeals
                    .Include(a => a.User)
                    .Where(a => a.SchoolId == schoolId);

                if (status.HasValue)
                    dbQuery = dbQuery.Where(a => a.Status == status.Value);

                if (createdFrom.HasValue)
                    dbQuery = dbQuery.Where(a => a.CreatedAt >= createdFrom.Value);

                if (createdTo.HasValue)
                    dbQuery = dbQuery.Where(a => a.CreatedAt <= createdTo.Value);

                var totalCount = await dbQuery.CountAsync();

                dbQuery = dbQuery.OrderByDescending(a => a.CreatedAt);

                if (pageNumber.HasValue && pageSize.HasValue)
                    dbQuery = dbQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);

                var appeals = await dbQuery.ToListAsync();
                var result = appeals.Select(a => MapAppealToEntity(a)).ToList();

                return (result, totalCount);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetAppealsBySchoolAsync failed: " + ex.Message).LogError();
                return (new List<ForumAppeal>(), 0);
            }
        }

        public async Task<List<ForumAppeal>> GetPendingAppealsBySchoolAsync(int schoolId)
        {
            try
            {
                var appeals = await _context.ForumAppeals
                    .Include(a => a.User)
                    .Where(a => a.SchoolId == schoolId && a.Status == false && a.UpdatedAt == null)
                    .OrderBy(a => a.CreatedAt)
                    .ToListAsync();

                return appeals.Select(a => MapAppealToEntity(a)).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "GetPendingAppealsBySchoolAsync failed: " + ex.Message).LogError();
                return new List<ForumAppeal>();
            }
        }

        public async Task<ForumAppeal> CreateAppealAsync(ForumAppeal appeal)
        {
            try
            {
                var entity = new Data.ForumAppeal
                {
                    UserId = appeal.UserId,
                    SchoolId = appeal.SchoolId,
                    Reason = appeal.Reason,
                    Status = appeal.Status,
                    CreatedAt = appeal.CreatedAt
                };

                _context.ForumAppeals.Add(entity);
                await _context.SaveChangesAsync();

                appeal.Id = entity.Id;
                return appeal;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "CreateAppealAsync failed: " + ex.Message).LogError();
                throw;
            }
        }

        public async Task<bool> ApproveAppealAsync(int appealId, Guid moderatorId)
        {
            try
            {
                var entity = await _context.ForumAppeals.FindAsync(appealId);
                if (entity == null) return false;

                entity.Status = true;
                entity.UpdatedAt = DateTime.Now;
                entity.UpdatedBy = moderatorId;

                var userId = entity.UserId;
                await UnmuteUserAsync(userId, entity.SchoolId);
                await ResetViolationScoreAsync(userId, entity.SchoolId);

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "ApproveAppealAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<bool> RejectAppealAsync(int appealId, Guid moderatorId)
        {
            try
            {
                var entity = await _context.ForumAppeals.FindAsync(appealId);
                if (entity == null) return false;

                entity.Status = false;
                entity.UpdatedAt = DateTime.Now;
                entity.UpdatedBy = moderatorId;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumModerationRepository", "RejectAppealAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        private string RemoveDiacritics(string text)
        {
            var normalizedString = text.Normalize(NormalizationForm.FormD);
            var stringBuilder = new StringBuilder();

            foreach (var c in normalizedString)
            {
                var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }

            return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
        }

        private static ForumRule MapRuleToEntity(Data.ForumRule r)
        {
            return new ForumRule
            {
                Id = r.Id,
                SchoolId = r.SchoolId,
                Name = r.Name,
                RuleType = r.RuleType,
                Severity = r.Severity,
                ViolationScore = r.ViolationScore,
                IsActive = r.IsActive ?? false,
                Description = r.Description,
                CreatedAt = r.CreatedAt,
                CreatedBy = r.CreatedBy,
                UpdatedAt = r.UpdatedAt,
                UpdatedBy = r.UpdatedBy
            };
        }

        private static RulePattern MapPatternToEntity(Data.RulePattern p)
        {
            return new RulePattern
            {
                Id = p.Id,
                RuleId = p.RuleId,
                Pattern = p.Pattern,
                IsActive = p.IsActive ?? false,
                CreatedAt = p.CreatedAt,
                CreatedBy = p.CreatedBy,
                UpdatedAt = p.UpdatedAt,
                UpdatedBy = p.UpdatedBy
            };
        }

        private static UserForumStatus MapUserForumStatusToEntity(Data.UserForumStatus s)
        {
            return new UserForumStatus
            {
                UserId = s.UserId,
                SchoolId = s.SchoolId,
                TotalViolationScore = s.TotalViolationScore,
                IsMute = s.IsMute,
                MuteUntil = s.MuteUntil,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt,
                User = s.User != null ? new AppUser
                {
                    Id = Guid.Parse(s.User.Id.ToString()),
                    Username = s.User.Username,
                    Fullname = s.User.Fullname,
                    Avatar = s.User.Avatar
                } : null
            };
        }

        private static ViolationRecord MapViolationRecordToEntity(Data.ViolationRecord r)
        {
            return new ViolationRecord
            {
                Id = r.Id,
                UserId = r.UserId,
                SchoolId = r.SchoolId,
                PostId = r.PostId,
                CommentId = r.CommentId,
                MatchedRuleId = r.MatchedRuleId,
                MatchedPatternId = r.MatchedPatternId,
                ViolationScore = r.ViolationScore,
                SourceType = r.SourceType,
                ReportedBy = r.ReportedBy,
                CreatedAt = r.CreatedAt,
                DeletedAt = r.DeletedAt,
                User = r.User != null ? new AppUser
                {
                    Id = Guid.Parse(r.User.Id.ToString()),
                    Username = r.User.Username
                } : null,
                Post = r.Post != null ? new ForumPost
                {
                    Id = r.Post.Id,
                    Title = r.Post.Title
                } : null,
                Rule = r.MatchedRule != null ? new ForumRule
                {
                    Id = r.MatchedRule.Id,
                    Name = r.MatchedRule.Name
                } : null,
                Pattern = r.MatchedPattern != null ? new RulePattern
                {
                    Id = r.MatchedPattern.Id,
                    Pattern = r.MatchedPattern.Pattern
                } : null,
                Reporter = r.ReportedByNavigation != null ? new AppUser
                {
                    Id = Guid.Parse(r.ReportedByNavigation.Id.ToString()),
                    Username = r.ReportedByNavigation.Username
                } : null
            };
        }

        private static ForumAppeal MapAppealToEntity(Data.ForumAppeal a)
        {
            return new ForumAppeal
            {
                Id = a.Id,
                UserId = a.UserId,
                SchoolId = a.SchoolId,
                Reason = a.Reason,
                Status = a.Status,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                UpdatedBy = a.UpdatedBy,
                User = a.User != null ? new AppUser
                {
                    Id = Guid.Parse(a.User.Id.ToString()),
                    Username = a.User.Username,
                    Fullname = a.User.Fullname
                } : null
            };
        }
    }
}