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
    }
}
