using System;
using System.Collections.Generic;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class RetentionDto
    {
        public DateTime CohortStart { get; set; }
        public DateTime CohortEnd { get; set; }
        public int CohortCount { get; set; }
        public int RetainedCount { get; set; }
        public double RetentionRate { get; set; }
        public int ReturnAfterDays { get; set; }
    }

    public class AverageLoginFrequencyDto
    {
        public int TotalLogins { get; set; }
        public int DistinctUsers { get; set; }
        public double AveragePerUser { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
    }

    public class HourCountDto
    {
        public int Hour { get; set; }
        public int Count { get; set; }
    }
}
