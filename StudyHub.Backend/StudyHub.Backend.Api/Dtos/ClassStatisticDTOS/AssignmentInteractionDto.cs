namespace StudyHub.Backend.Api.Dtos.ClassStatisticDTOS
{
    public class AssignmentInteractionDto
    {
        public int NotificationId { get; set; }
        public string CreateBy { get; set; }
        public string Title { get; set; } = string.Empty;
        public int SubmissionsCount { get; set; }
    }
}
