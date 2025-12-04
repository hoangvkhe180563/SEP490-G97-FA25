namespace StudyHub.Backend.Api.Dtos.ClassStatisticDTOS
{
    public class ClassStatsDto
    {
        public int ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public int StudentsCount { get; set; }

        // Fractions in range 0..1
        public double SubmissionRate { get; set; }
        public double ReadRate { get; set; }

        public int ClassworksCount { get; set; }
        public int NotificationsCount { get; set; }
        public int TotalSubmissions { get; set; }
    }
}
