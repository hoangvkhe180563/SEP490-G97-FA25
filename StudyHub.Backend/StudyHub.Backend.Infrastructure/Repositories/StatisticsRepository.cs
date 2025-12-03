using System;
using System.Linq;
using System.Collections.Generic;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class StatisticsRepository : IStatisticsRepository
    {
        private readonly AppDbContext _context;

        public StatisticsRepository(AppDbContext context)
        {
            _context = context;
        }

        public AccountsOverviewDto GetAccountsOverview(string period = "day", int range = 30)
        {
            var dto = new AccountsOverviewDto();

            var users = _context.AppUsers.AsQueryable();

            dto.TotalUsers = users.Count();

            // Role distribution
            var roleCounts = users.SelectMany(u => u.Roles.DefaultIfEmpty())
                .Where(r => r != null)
                .GroupBy(r => r!.Name)
                .Select(g => new RoleCountDto { Role = g.Key ?? "", Count = g.Count() })
                .ToList();
            dto.RoleDistribution = roleCounts;

            // Active / Inactive
            var activeCount = users.Count(u => u.Status == true);
            var inactiveCount = users.Count(u => u.Status != true);
            dto.ActiveCount = activeCount;
            dto.InactiveCount = inactiveCount;
            dto.InactiveRate = dto.TotalUsers == 0 ? 0 : (double)inactiveCount / dto.TotalUsers * 100.0;

            // New accounts by period for last 'range' days/months/weeks
            var since = DateTime.Now.AddDays(-range);
            var recent = _context.AppUsers.Where(u => u.CreatedAt >= since).ToList();

            var list = new List<DateCountDto>();
            if (period == "day")
            {
                var groups = recent.GroupBy(u => u.CreatedAt.Date).OrderBy(g => g.Key);
                foreach (var g in groups)
                {
                    list.Add(new DateCountDto { Period = g.Key.ToString("yyyy-MM-dd"), Count = g.Count() });
                }
            }
            else if (period == "week")
            {
                var groups = recent.GroupBy(u => System.Globalization.CultureInfo.InvariantCulture.Calendar.GetWeekOfYear(u.CreatedAt, System.Globalization.CalendarWeekRule.FirstDay, DayOfWeek.Monday))
                    .OrderBy(g => g.Key);
                foreach (var g in groups)
                {
                    var any = g.First().CreatedAt;
                    var label = $"{any.Year}-W{g.Key}";
                    list.Add(new DateCountDto { Period = label, Count = g.Count() });
                }
            }
            else // month
            {
                var groups = recent.GroupBy(u => new { u.CreatedAt.Year, u.CreatedAt.Month }).OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month);
                foreach (var g in groups)
                {
                    var label = $"{g.Key.Year}-{g.Key.Month.ToString().PadLeft(2, '0')}";
                    list.Add(new DateCountDto { Period = label, Count = g.Count() });
                }
            }
            dto.NewAccountsByPeriod = list;

            return dto;
        }

        public AccountRecoveryStatsDto GetAccountRecoveryStats()
        {
            var dto = new AccountRecoveryStatsDto();
            var q = _context.AccountRecoveryRequests.AsQueryable();
            dto.TotalRequests = q.Count();
            dto.ApprovedCount = q.Count(r => r.Status != null && (r.Status == "Approved" || r.Status == "Đã phê duyệt"));
            dto.RejectedCount = q.Count(r => r.Status != null && (r.Status == "Rejected" || r.Status == "Đã từ chối"));

            dto.ApprovedRate = dto.TotalRequests == 0 ? 0 : (double)dto.ApprovedCount / dto.TotalRequests * 100.0;
            dto.RejectedRate = dto.TotalRequests == 0 ? 0 : (double)dto.RejectedCount / dto.TotalRequests * 100.0;

            var resolved = q.Where(r => r.ProcessedAt != null).ToList();
            if (resolved.Count == 0)
            {
                dto.AverageResolveMinutes = 0;
            }
            else
            {
                var totalMinutes = resolved.Sum(r => (r.ProcessedAt!.Value - r.CreatedAt).TotalMinutes);
                dto.AverageResolveMinutes = totalMinutes / resolved.Count;
            }

            return dto;
        }

        public RetentionDto GetRetention(DateTime cohortStart, DateTime cohortEnd, int returnAfterDays)
        {
            var dto = new RetentionDto();
            dto.CohortStart = cohortStart;
            dto.CohortEnd = cohortEnd;
            dto.ReturnAfterDays = returnAfterDays;

            // users created within cohort
            // Use a set-based query: join users in cohort with successful login histories that fall on (CreatedAt.Date + returnAfterDays)
            var cohortQuery = _context.AppUsers.Where(u => u.CreatedAt >= cohortStart && u.CreatedAt <= cohortEnd);
            dto.CohortCount = cohortQuery.Count();
            if (dto.CohortCount == 0)
            {
                dto.RetainedCount = 0;
                dto.RetentionRate = 0;
                return dto;
            }

            // Join users with login histories and filter by login falling into the target day window per user.
            var retainedQuery = cohortQuery
                .Join(_context.AppUserLoginHistories.Where(h => h.IsSuccess == null || h.IsSuccess == true),
                      u => u.Id,
                      h => h.UserId,
                      (u, h) => new { u.Id, u.CreatedAt, h.LoginAt })
                .Where(x => x.LoginAt >= x.CreatedAt.Date.AddDays(returnAfterDays) && x.LoginAt < x.CreatedAt.Date.AddDays(returnAfterDays + 1))
                .Select(x => x.Id)
                .Distinct();

            var retainedCount = retainedQuery.Count();
            dto.RetainedCount = retainedCount;
            dto.RetentionRate = dto.CohortCount == 0 ? 0 : (double)retainedCount / dto.CohortCount * 100.0;
            return dto;
        }

        public AverageLoginFrequencyDto GetAverageLoginFrequency(DateTime start, DateTime end)
        {
            var dto = new AverageLoginFrequencyDto();
            dto.PeriodStart = start;
            dto.PeriodEnd = end;

            var q = _context.AppUserLoginHistories.Where(h => h.LoginAt >= start && h.LoginAt <= end && (h.IsSuccess == null || h.IsSuccess == true));
            dto.TotalLogins = q.Count();
            dto.DistinctUsers = q.Select(h => h.UserId).Distinct().Count();
            dto.AveragePerUser = dto.DistinctUsers == 0 ? 0 : (double)dto.TotalLogins / dto.DistinctUsers;
            return dto;
        }

        public List<HourCountDto> GetPeakHours(DateTime? start, DateTime? end, int top = 5)
        {
            var q = _context.AppUserLoginHistories.AsQueryable();
            if (start.HasValue) q = q.Where(h => h.LoginAt >= start.Value);
            if (end.HasValue) q = q.Where(h => h.LoginAt <= end.Value);
            q = q.Where(h => h.IsSuccess == null || h.IsSuccess == true);

            var groups = q.ToList().GroupBy(h => h.LoginAt.Hour)
                .Select(g => new HourCountDto { Hour = g.Key, Count = g.Count() })
                .OrderByDescending(h => h.Count)
                .Take(top)
                .ToList();
            return groups;
        }

        public PagedResultDto<DateCountDto> GetDAU(DateTime start, DateTime end, int page = 1, int pageSize = 100)
        {
            var q = _context.AppUserLoginHistories.Where(h => h.LoginAt >= start && h.LoginAt <= end && (h.IsSuccess == null || h.IsSuccess == true));

            var groupedQuery = q.GroupBy(h => new { h.LoginAt.Year, h.LoginAt.Month, h.LoginAt.Day })
                .Select(g => new { Key = g.Key, Count = g.Select(h => h.UserId).Distinct().Count() });

            var total = groupedQuery.Count();

            var pageItems = groupedQuery
                .OrderBy(k => k.Key.Year).ThenBy(k => k.Key.Month).ThenBy(k => k.Key.Day)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .ToList()
                .Select(g => new DateCountDto { Period = new DateTime(g.Key.Year, g.Key.Month, g.Key.Day).ToString("yyyy-MM-dd"), Count = g.Count })
                .ToList();

            return new PagedResultDto<DateCountDto>
            {
                Items = pageItems,
                TotalCount = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = pageSize <= 0 ? 0 : (int)Math.Ceiling(total / (double)pageSize)
            };
        }

        public PagedResultDto<DateCountDto> GetMAU(DateTime start, DateTime end, int page = 1, int pageSize = 100)
        {
            var q = _context.AppUserLoginHistories.Where(h => h.LoginAt >= start && h.LoginAt <= end && (h.IsSuccess == null || h.IsSuccess == true));

            var groupedQuery = q.GroupBy(h => new { h.LoginAt.Year, h.LoginAt.Month })
                .Select(g => new { Key = g.Key, Count = g.Select(h => h.UserId).Distinct().Count() });

            var total = groupedQuery.Count();

            var pageItems = groupedQuery
                .OrderBy(k => k.Key.Year).ThenBy(k => k.Key.Month)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .ToList()
                .Select(g => new DateCountDto { Period = $"{g.Key.Year}-{g.Key.Month.ToString().PadLeft(2, '0')}", Count = g.Count })
                .ToList();

            return new PagedResultDto<DateCountDto>
            {
                Items = pageItems,
                TotalCount = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = pageSize <= 0 ? 0 : (int)Math.Ceiling(total / (double)pageSize)
            };
        }

        // -------- LLM history statistics --------
        public List<StudentQuestionStatsDto> GetLlmQuestionsByStudent(DateTime? start, DateTime? end, int top = 100)
        {
            var q = _context.LlmHistories.AsQueryable();
            if (start.HasValue) q = q.Where(h => h.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(h => h.CreatedAt <= end.Value);
            //q = q.Where(h => h.Status != "Đã xoá");

            var groups = q.GroupBy(h => h.UserId)
                .Select(g => new StudentQuestionStatsDto
                {
                    UserId = g.Key,
                    FullName = g.Select(x => x.User.Fullname).FirstOrDefault(),
                    TotalQuestions = g.Count()
                })
                .OrderByDescending(x => x.TotalQuestions)
                .Take(top)
                .ToList();
            return groups;
        }

        public List<DateCountDto> GetLlmQuestionsTimeSeries(string period, DateTime start, DateTime end)
        {
            var q = _context.LlmHistories
                .Where(h => h.CreatedAt >= start && h.CreatedAt <= end
             && h.Status != "Đã xoá");

            var list = new List<DateCountDto>();

            if (period == "day")
            {
                // Cách 1: select trước → AsEnumerable → GroupBy không bị lỗi EF
                var groups = q
                    .Select(h => new
                    {
                        Date = h.CreatedAt.Value.Date
                    })
                    .AsEnumerable()
                    .GroupBy(x => x.Date)
                    .OrderBy(g => g.Key);

                foreach (var g in groups)
                {
                    list.Add(new DateCountDto
                    {
                        Period = g.Key.ToString("yyyy-MM-dd"),
                        Count = g.Count()
                    });
                }
            }
            else if (period == "week")
            {
                var groups = q
                    .AsEnumerable()
                    .GroupBy(h =>
                        System.Globalization.CultureInfo.InvariantCulture.Calendar.GetWeekOfYear(
                            h.CreatedAt.Value,
                            System.Globalization.CalendarWeekRule.FirstDay,
                            DayOfWeek.Monday))
                    .OrderBy(g => g.Key);

                foreach (var g in groups)
                {
                    var any = g.First().CreatedAt.Value;
                    list.Add(new DateCountDto
                    {
                        Period = $"{any.Year}-W{g.Key}",
                        Count = g.Count()
                    });
                }
            }
            else // month
            {
                // Cái này EF có thể dịch nên giữ nguyên
                var groups = q
                    .GroupBy(h => new { h.CreatedAt.Value.Year, h.CreatedAt.Value.Month })
                    .OrderBy(g => g.Key.Year)
                    .ThenBy(g => g.Key.Month)
                    .Select(g => new DateCountDto
                    {
                        Period = $"{g.Key.Year}-{g.Key.Month.ToString().PadLeft(2, '0')}",
                        Count = g.Count()
                    })
                    .ToList();

                return groups;
            }

            return list;
        }

        public List<HourCountDto> GetLlmPeakHoursForLlm(DateTime? start, DateTime? end, int top = 5)
        {
            var q = _context.LlmHistories.AsQueryable();
            if (start.HasValue) q = q.Where(h => h.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(h => h.CreatedAt <= end.Value);
            //q = q.Where(h => h.Status != "Đã xoá");

            var groups = q.ToList().GroupBy(h => h.CreatedAt.Value.Hour)
                .Select(g => new HourCountDto { Hour = g.Key, Count = g.Count() })
                .OrderByDescending(h => h.Count)
                .Take(top)
                .ToList();
            return groups;
        }

        public List<SubjectCountDto> GetTopSubjects(DateTime? start, DateTime? end, int top = 10)
        {
            var q = _context.LlmHistories.AsQueryable();
            if (start.HasValue) q = q.Where(h => h.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(h => h.CreatedAt <= end.Value);
            q = q.Where(h =>
                            //h.Status != "Đã xoá" && 
                            h.Llmresponse != null
            );

            var subjectCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            foreach (var row in q)
            {
                try
                {
                    var raw = row.Llmresponse!;
                    using var doc = System.Text.Json.JsonDocument.Parse(raw);
                    if (doc.RootElement.TryGetProperty("profile", out var profileEl))
                    {
                        if (profileEl.ValueKind == System.Text.Json.JsonValueKind.Object && profileEl.TryGetProperty("subject", out var subjEl) && subjEl.ValueKind == System.Text.Json.JsonValueKind.Array)
                        {
                            foreach (var sEl in subjEl.EnumerateArray())
                            {
                                if (sEl.ValueKind == System.Text.Json.JsonValueKind.String)
                                {
                                    var s = sEl.GetString();
                                    if (string.IsNullOrWhiteSpace(s)) continue;
                                    var key = s.Trim();
                                    if (!subjectCounts.ContainsKey(key)) subjectCounts[key] = 0;
                                    subjectCounts[key]++;
                                }
                            }
                        }
                    }
                }
                catch { /* ignore parse errors */ }
            }

            return subjectCounts.OrderByDescending(kv => kv.Value).Take(top).Select(kv => new SubjectCountDto { Subject = kv.Key, Count = kv.Value }).ToList();
        }

        // -------- QA conversation statistics --------
        public int GetTotalQAConversations(DateTime? start, DateTime? end)
        {
            var q = _context.QAConversations.AsQueryable();
            if (start.HasValue) q = q.Where(c => c.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(c => c.CreatedAt <= end.Value);
            return q.Count();
        }

        public List<SubjectCountDto> GetQAConversationCountBySubject(DateTime? start, DateTime? end, int top = 10)
        {
            var q = _context.QAConversations.AsQueryable();
            if (start.HasValue) q = q.Where(c => c.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(c => c.CreatedAt <= end.Value);

            var groups = q
                .Select(c => new { Subject = c.Topic.Subject.Name })
                .AsEnumerable()
                .GroupBy(x => x.Subject)
                .Select(g => new SubjectCountDto { Subject = g.Key ?? string.Empty, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(top)
                .ToList();

            return groups;
        }

        public List<TopicCountDto> GetQAConversationCountByTopic(DateTime? start, DateTime? end, int top = 10)
        {
            var q = _context.QAConversations.AsQueryable();
            if (start.HasValue) q = q.Where(c => c.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(c => c.CreatedAt <= end.Value);

            var groups = q
                .Select(c => new { Topic = c.Topic.Name })
                .AsEnumerable()
                .GroupBy(x => x.Topic)
                .Select(g => new TopicCountDto { Topic = g.Key ?? string.Empty, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(top)
                .ToList();

            return groups;
        }

        public long GetTotalQAMessages(DateTime? start, DateTime? end)
        {
            var q = _context.QAMessages.AsQueryable();
            if (start.HasValue) q = q.Where(m => m.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(m => m.CreatedAt <= end.Value);
            return q.LongCount();
        }

        private (DateTime min, DateTime max) ResolveRange(IQueryable<Data.QAConversation> q)
        {
            var min = q.Min(c => (DateTime?)c.CreatedAt) ?? DateTime.Now;
            var max = q.Max(c => (DateTime?)c.CreatedAt) ?? DateTime.Now;
            return (min, max);
        }

        public double GetAveragePaidConversationsPerDay(DateTime? start, DateTime? end)
        {
            var q = _context.QAConversations.AsQueryable();
            if (start.HasValue) q = q.Where(c => c.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(c => c.CreatedAt <= end.Value);

            var paidCount = q.Count(c => c.IsPaid);
            var range = ResolveRange(q);
            var days = Math.Max(1, (int)Math.Ceiling((range.max - range.min).TotalDays));
            return (double)paidCount / days;
        }

        public double GetAveragePaidConversationsPerWeek(DateTime? start, DateTime? end)
        {
            var q = _context.QAConversations.AsQueryable();
            if (start.HasValue) q = q.Where(c => c.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(c => c.CreatedAt <= end.Value);

            var paidCount = q.Count(c => c.IsPaid);
            var range = ResolveRange(q);
            var weeks = Math.Max(1, (int)Math.Ceiling((range.max - range.min).TotalDays / 7.0));
            return (double)paidCount / weeks;
        }

        public double GetAveragePaidConversationsPerMonth(DateTime? start, DateTime? end)
        {
            var q = _context.QAConversations.AsQueryable();
            if (start.HasValue) q = q.Where(c => c.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(c => c.CreatedAt <= end.Value);

            var paidCount = q.Count(c => c.IsPaid);
            var range = ResolveRange(q);
            var months = Math.Max(1, ((range.max.Year - range.min.Year) * 12) + range.max.Month - range.min.Month + 1);
            return (double)paidCount / months;
        }

        public double GetAverageMessagesPerDay(DateTime? start, DateTime? end)
        {
            var q = _context.QAMessages.AsQueryable();
            if (start.HasValue) q = q.Where(m => m.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(m => m.CreatedAt <= end.Value);

            var total = q.Count();
            var min = q.Min(m => (DateTime?)m.CreatedAt) ?? DateTime.Now;
            var max = q.Max(m => (DateTime?)m.CreatedAt) ?? DateTime.Now;
            var days = Math.Max(1, (int)Math.Ceiling((max - min).TotalDays));
            return (double)total / days;
        }

        public double GetAverageMessagesPerWeek(DateTime? start, DateTime? end)
        {
            var q = _context.QAMessages.AsQueryable();
            if (start.HasValue) q = q.Where(m => m.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(m => m.CreatedAt <= end.Value);

            var total = q.Count();
            var min = q.Min(m => (DateTime?)m.CreatedAt) ?? DateTime.Now;
            var max = q.Max(m => (DateTime?)m.CreatedAt) ?? DateTime.Now;
            var weeks = Math.Max(1, (int)Math.Ceiling((max - min).TotalDays / 7.0));
            return (double)total / weeks;
        }

        public double GetAverageMessagesPerMonth(DateTime? start, DateTime? end)
        {
            var q = _context.QAMessages.AsQueryable();
            if (start.HasValue) q = q.Where(m => m.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(m => m.CreatedAt <= end.Value);

            var total = q.Count();
            var min = q.Min(m => (DateTime?)m.CreatedAt) ?? DateTime.UtcNow;
            var max = q.Max(m => (DateTime?)m.CreatedAt) ?? DateTime.UtcNow;
            var months = Math.Max(1, ((max.Year - min.Year) * 12) + max.Month - min.Month + 1);
            return (double)total / months;
        }

        public List<TeacherStatsDto> GetTopTeachers(DateTime? start, DateTime? end, int top = 10, string sortBy = "response")
        {
            var q = _context.QAConversations.Include(c => c.Teacher).AsQueryable();
            if (start.HasValue) q = q.Where(c => c.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(c => c.CreatedAt <= end.Value);

            // Consider only conversations that have an assigned teacher
            var convs = q.Where(c => c.TeacherId != null).ToList();

            var stats = new Dictionary<Guid, (string name, int count, double totalMinutes)>();

            foreach (var conv in convs)
            {
                var tId = conv.TeacherId!.Value;
                if (!stats.ContainsKey(tId)) stats[tId] = (conv.Teacher?.Fullname ?? string.Empty, 0, 0.0);
                var entry = stats[tId];
                entry.count += 1;

                // find first teacher message in this conversation
                var firstTeacherMsg = _context.QAMessages.Where(m => m.ConversationId == conv.Id && m.SenderId == conv.TeacherId).OrderBy(m => m.CreatedAt).FirstOrDefault();
                if (firstTeacherMsg != null)
                {
                    var minutes = (firstTeacherMsg.CreatedAt - conv.CreatedAt).TotalMinutes;
                    entry.totalMinutes += minutes;
                }

                stats[tId] = entry;
            }

            var results = stats.Select(kv => new TeacherStatsDto
            {
                TeacherId = kv.Key,
                FullName = kv.Value.name,
                ConversationCount = kv.Value.count,
                AverageFirstResponseMinutes = kv.Value.count == 0 ? 0 : Math.Round(kv.Value.totalMinutes / kv.Value.count, 2)
            }).ToList();

            if ((sortBy ?? "").ToLowerInvariant() == "conversations")
            {
                return results.OrderByDescending(r => r.ConversationCount).Take(top).ToList();
            }

            // default: sort by average response minutes ascending (fastest responders first)
            return results.OrderBy(r => r.AverageFirstResponseMinutes).Take(top).ToList();
        }

        public List<StudentQuestionStatsDto> GetTopQaStudents(DateTime? start, DateTime? end, int top = 10)
        {
            var q = _context.QAConversations.AsQueryable();
            if (start.HasValue) q = q.Where(c => c.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(c => c.CreatedAt <= end.Value);

            var groups = q.GroupBy(c => c.StudentId)
                .Select(g => new StudentQuestionStatsDto
                {
                    UserId = g.Key,
                    FullName = g.Select(x => x.Student.Fullname).FirstOrDefault(),
                    TotalQuestions = g.Count()
                })
                .OrderByDescending(x => x.TotalQuestions)
                .Take(top)
                .ToList();

            return groups;
        }

        public List<SubjectCountDto> GetTopQaSubjects(DateTime? start, DateTime? end, int top = 10)
        {
            // Reuse conversation-by-subject implementation
            return GetQAConversationCountBySubject(start, end, top);
        }

        public TokenSummaryDto GetTokenSummary(DateTime? start, DateTime? end)
        {
            var q = _context.LlmHistories.AsQueryable();
            if (start.HasValue) q = q.Where(h => h.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(h => h.CreatedAt <= end.Value);
            //q = q.Where(h => h.Status != "Đã xoá");

            var totalInput = q.Where(h => h.InputTokens != null).Sum(h => (long?)h.InputTokens) ?? 0L;
            var totalOutput = q.Where(h => h.OutputTokens != null).Sum(h => (long?)h.OutputTokens) ?? 0L;
            var totalQuestions = q.Count();
            var avg = totalQuestions == 0 ? 0.0 : (double)(totalInput + totalOutput) / totalQuestions;
            return new TokenSummaryDto { TotalInputTokens = totalInput, TotalOutputTokens = totalOutput, AverageTokensPerQuestion = avg };
        }

        public List<DateTokenDto> GetTokenByMonth(DateTime? start, DateTime? end)
        {
            var q = _context.LlmHistories.AsQueryable();

            if (start.HasValue)
                q = q.Where(h => h.CreatedAt >= start.Value);

            if (end.HasValue)
                q = q.Where(h => h.CreatedAt <= end.Value);

            //q = q.Where(h => h.Status != "Đã xoá");

            // CÁCH 1: Select trước để EF có thể dịch → AsEnumerable → GroupBy client
            var data = q
                .Where(h => h.InputTokens != null || h.OutputTokens != null)
                .Select(h => new
                {
                    Year = h.CreatedAt.Value.Year,
                    Month = h.CreatedAt.Value.Month,
                    Tokens = (long)(h.InputTokens ?? 0) + (long)(h.OutputTokens ?? 0)
                })
                .AsEnumerable()  // Chuyển sang client để GroupBy an toàn
                .GroupBy(x => new { x.Year, x.Month })
                .OrderBy(g => g.Key.Year)
                .ThenBy(g => g.Key.Month)
                .Select(g => new DateTokenDto
                {
                    Period = $"{g.Key.Year}-{g.Key.Month.ToString().PadLeft(2, '0')}",
                    Tokens = g.Sum(x => x.Tokens)
                })
                .ToList();

            return data;
        }

        public List<DateTokenDto> GetTokenByPeriod(string period, DateTime? start, DateTime? end)
        {
            var q = _context.LlmHistories.AsQueryable();

            if (start.HasValue)
                q = q.Where(h => h.CreatedAt >= start.Value);

            if (end.HasValue)
                q = q.Where(h => h.CreatedAt <= end.Value);

            //q = q.Where(h => h.Status != "Đã xoá");

            period = (period ?? "month").ToLowerInvariant();

            if (period == "day")
            {
                var data = q
                    .Where(h => h.InputTokens != null || h.OutputTokens != null)
                    .Select(h => new
                    {
                        Year = h.CreatedAt.Value.Year,
                        Month = h.CreatedAt.Value.Month,
                        Day = h.CreatedAt.Value.Day,
                        Tokens = (long)(h.InputTokens ?? 0) + (long)(h.OutputTokens ?? 0)
                    })
                    .AsEnumerable()
                    .GroupBy(x => new { x.Year, x.Month, x.Day })
                    .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month).ThenBy(g => g.Key.Day)
                    .Select(g => new DateTokenDto { Period = new DateTime(g.Key.Year, g.Key.Month, g.Key.Day).ToString("yyyy-MM-dd"), Tokens = g.Sum(x => x.Tokens) })
                    .ToList();
                return data;
            }

            if (period == "week")
            {
                var items = q
                    .Where(h => h.InputTokens != null || h.OutputTokens != null)
                    .Select(h => new { At = h.CreatedAt.Value, Tokens = (long)(h.InputTokens ?? 0) + (long)(h.OutputTokens ?? 0) })
                    .AsEnumerable()
                    .GroupBy(x => new { Year = x.At.Year, Week = System.Globalization.CultureInfo.InvariantCulture.Calendar.GetWeekOfYear(x.At, System.Globalization.CalendarWeekRule.FirstDay, DayOfWeek.Monday) })
                    .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Week)
                    .Select(g => new DateTokenDto { Period = $"{g.Key.Year}-W{g.Key.Week}", Tokens = g.Sum(x => x.Tokens) })
                    .ToList();
                return items;
            }

            // default month
            return GetTokenByMonth(start, end);
        }

        public List<UserTokenDto> GetTopTokenUsers(DateTime? start, DateTime? end, int top = 10)
        {
            var q = _context.LlmHistories.AsQueryable();
            if (start.HasValue) q = q.Where(h => h.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(h => h.CreatedAt <= end.Value);
            //q = q.Where(h => h.Status != "Đã xoá");

            var groups = q.GroupBy(h => h.UserId)
                .Select(g => new UserTokenDto
                {
                    UserId = g.Key,
                    FullName = g.Select(x => x.User.Fullname).FirstOrDefault(),
                    TotalTokens = g.Sum(h => (long?)(h.InputTokens ?? 0) + (long?)(h.OutputTokens ?? 0)) ?? 0
                })
                .OrderByDescending(x => x.TotalTokens)
                .Take(top)
                .ToList();

            return groups;
        }

        public List<RecommendedItemCountDto> GetTopRecommendedCourses(DateTime? start, DateTime? end, int top = 10)
        {
            var q = _context.LlmHistories.AsQueryable();
            if (start.HasValue) q = q.Where(h => h.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(h => h.CreatedAt <= end.Value);
            q = q.Where(h => h.Llmresponse != null);

            var counts = new Dictionary<string, (string title, int count, string subject, string imageUrl)>(StringComparer.OrdinalIgnoreCase);

            foreach (var row in q)
            {
                try
                {
                    var raw = row.Llmresponse!;
                    using var doc = System.Text.Json.JsonDocument.Parse(raw);
                    var root = doc.RootElement;

                    // Try common property name casing (camelCase or PascalCase)
                    if (!root.TryGetProperty("courseRecommendations", out var arr) && !root.TryGetProperty("CourseRecommendations", out arr))
                    {
                        continue;
                    }

                    if (arr.ValueKind != System.Text.Json.JsonValueKind.Array) continue;

                    foreach (var el in arr.EnumerateArray())
                    {
                        string id = string.Empty;
                        string title = string.Empty;
                        string subject = string.Empty;
                        string imageUrl = string.Empty;
                        if (el.TryGetProperty("id", out var idEl) || el.TryGetProperty("Id", out idEl)) id = idEl.GetString() ?? "";
                        if (el.TryGetProperty("title", out var tEl) || el.TryGetProperty("Title", out tEl)) title = tEl.GetString() ?? "";
                        if (el.TryGetProperty("subject", out var sEl) || el.TryGetProperty("Subject", out sEl)) subject = sEl.GetString() ?? "";
                        // Try common image property names
                        if (el.TryGetProperty("imageUrl", out var imgEl) || el.TryGetProperty("ImageUrl", out imgEl) || el.TryGetProperty("image", out imgEl) || el.TryGetProperty("Image", out imgEl))
                        {
                            imageUrl = imgEl.GetString() ?? string.Empty;
                        }
                        if (string.IsNullOrWhiteSpace(id)) continue;
                        if (!counts.ContainsKey(id)) counts[id] = (title, 0, subject, imageUrl);
                        var prev = counts[id];
                        // prefer existing imageUrl if present, otherwise keep new one
                        var chosenImage = !string.IsNullOrWhiteSpace(prev.imageUrl) ? prev.imageUrl : imageUrl;
                        counts[id] = (prev.title ?? title, prev.count + 1, prev.subject ?? subject, chosenImage);
                    }
                }
                catch { /* ignore parse errors */ }
            }

            return counts.OrderByDescending(kv => kv.Value.count).Take(top)
                .Select(kv => new RecommendedItemCountDto { Id = kv.Key, Title = kv.Value.title ?? kv.Key, Subject = kv.Value.subject ?? kv.Key, ImageUrl = string.IsNullOrWhiteSpace(kv.Value.imageUrl) ? null : kv.Value.imageUrl, Count = kv.Value.count })
                .ToList();
        }

        public List<RecommendedItemCountDto> GetTopRecommendedDocuments(DateTime? start, DateTime? end, int top = 10)
        {
            var q = _context.LlmHistories.AsQueryable();
            if (start.HasValue) q = q.Where(h => h.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(h => h.CreatedAt <= end.Value);
            q = q.Where(h => h.Llmresponse != null);

            var counts = new Dictionary<string, (string title, int count, string subject, string thumbnail)>(StringComparer.OrdinalIgnoreCase);

            foreach (var row in q)
            {
                try
                {
                    var raw = row.Llmresponse!;
                    using var doc = System.Text.Json.JsonDocument.Parse(raw);
                    var root = doc.RootElement;

                    if (!root.TryGetProperty("documentRecommendations", out var arr) && !root.TryGetProperty("DocumentRecommendations", out arr))
                    {
                        continue;
                    }

                    if (arr.ValueKind != System.Text.Json.JsonValueKind.Array) continue;

                    foreach (var el in arr.EnumerateArray())
                    {
                        string id = string.Empty;
                        string title = string.Empty;
                        string subject = string.Empty;
                        string thumbnail = string.Empty;
                        if (el.TryGetProperty("id", out var idEl) || el.TryGetProperty("Id", out idEl)) id = idEl.GetString() ?? "";
                        if (el.TryGetProperty("title", out var tEl) || el.TryGetProperty("Title", out tEl)) title = tEl.GetString() ?? "";
                        if (el.TryGetProperty("subject", out var sEl) || el.TryGetProperty("Subject", out sEl)) subject = sEl.GetString() ?? "";
                        // Try common thumbnail property names
                        if (el.TryGetProperty("thumbnail", out var thEl) || el.TryGetProperty("thumbnailUrl", out thEl) || el.TryGetProperty("Thumbnail", out thEl) || el.TryGetProperty("ThumbnailUrl", out thEl))
                        {
                            thumbnail = thEl.GetString() ?? string.Empty;
                        }
                        if (string.IsNullOrWhiteSpace(id)) continue;
                        if (!counts.ContainsKey(id)) counts[id] = (title, 0, subject, thumbnail);
                        var prev = counts[id];
                        var chosenThumb = !string.IsNullOrWhiteSpace(prev.thumbnail) ? prev.thumbnail : thumbnail;
                        counts[id] = (prev.title ?? title, prev.count + 1, prev.subject ?? subject, chosenThumb);
                    }
                }
                catch { /* ignore parse errors */ }
            }

            return counts.OrderByDescending(kv => kv.Value.count).Take(top)
                .Select(kv => new RecommendedItemCountDto { Id = kv.Key, Title = kv.Value.title ?? kv.Key, Subject = kv.Value.subject ?? kv.Key, Thumbnail = string.IsNullOrWhiteSpace(kv.Value.thumbnail) ? null : kv.Value.thumbnail, Count = kv.Value.count })
                .ToList();
        }
    }
}
