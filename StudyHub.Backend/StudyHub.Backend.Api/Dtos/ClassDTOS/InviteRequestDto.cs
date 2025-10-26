namespace StudyHub.Backend.Api.Dtos.ClassDTOS
{
    public class InviteRequest
    {
        public List<string>? Emails { get; set; }
        public string? Role { get; set; } = "Student";
        public string? Message { get; set; }
    }
}
