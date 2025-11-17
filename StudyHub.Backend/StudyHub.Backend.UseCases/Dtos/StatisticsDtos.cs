using System;
using System.Collections.Generic;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class RoleCountDto
    {
        public string Role { get; set; } = null!;
        public int Count { get; set; }
    }

    public class DateCountDto
    {
        public string Period { get; set; } = null!; // e.g., 2025-11-01 or 2025-W45 or 2025-11
        public int Count { get; set; }
    }

    public class AccountsOverviewDto
    {
        public int TotalUsers { get; set; }
        public List<RoleCountDto> RoleDistribution { get; set; } = new List<RoleCountDto>();
        public int ActiveCount { get; set; }
        public int InactiveCount { get; set; }
        public double InactiveRate { get; set; }
        public List<DateCountDto> NewAccountsByPeriod { get; set; } = new List<DateCountDto>();
    }

    public class AccountRecoveryStatsDto
    {
        public int TotalRequests { get; set; }
        public int ApprovedCount { get; set; }
        public int RejectedCount { get; set; }
        public double ApprovedRate { get; set; }
        public double RejectedRate { get; set; }
        public double AverageResolveMinutes { get; set; }
    }
}
