namespace StudyHub.Backend.Api.Dtos.ClassDTOS
{
    public class MemberDto
    {
        public Guid UserId { get; set; }
        public string Fullname { get; set; } = string.Empty;
        public required List<string> Roles { get; set; }
        public DateTime JoinDate { get; set; }
    }
}
