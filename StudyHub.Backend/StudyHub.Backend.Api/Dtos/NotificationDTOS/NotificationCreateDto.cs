namespace StudyHub.Backend.Api.Dtos.NotificationDTOS
{
    public class NotificationCreateDto
    {
        public string Title { get; set; } = null!;
        public string? Body { get; set; }
        public string? LinkUrl { get; set; }
        public string TargetType { get; set; } = null!; // "All" | "Role" | "Group" | "User"
        public Guid? TargetRoleId { get; set; }
        public int? TargetGroupId { get; set; }
        public Guid? TargetUserId { get; set; }
        public string Priority { get; set; } = "Normal"; // "Low" | "Normal" | "High"
        public DateTime? ExpiresAt { get; set; }
    }
}
