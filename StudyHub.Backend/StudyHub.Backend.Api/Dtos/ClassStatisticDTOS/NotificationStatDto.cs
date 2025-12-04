namespace StudyHub.Backend.Api.Dtos.ClassStatisticDTOS
{
    public class NotificationStatDto
    {
        public int NotificationId { get; set; }
        public string CreatedBy { get; set; }
        public string Title { get; set; } = string.Empty;
        public int ReadsCount { get; set; }
        public int IgnoredCount { get; set; }
        public int TotalRecipients { get; set; }
        public int SubmissionsCount { get; set; }
    }
}
