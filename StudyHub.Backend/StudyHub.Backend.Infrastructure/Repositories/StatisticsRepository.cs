using System;
using System.Linq;
using System.Collections.Generic;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;

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
            var since = DateTime.UtcNow.AddDays(-range);
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
    }
}
