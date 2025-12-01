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
    }
}
