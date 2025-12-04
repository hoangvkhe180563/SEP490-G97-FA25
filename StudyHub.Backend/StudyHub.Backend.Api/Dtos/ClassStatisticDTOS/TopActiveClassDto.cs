namespace StudyHub.Backend.Api.Dtos.ClassStatisticDTOS
{
    public class TopActiveClassDto
    {
        public int? ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public double ActivityScore { get; set; }
        public int NotificationsCount { get; set; }
        public int SubmissionsCount { get; set; }
        public int CommentsCount { get; set; }
    }
}
