namespace StudyHub.Backend.Api.Dtos.ClassDTOS
{
    public class MemberDto
    {
        public Guid UserId { get; set; }
        public string Fullname { get; set; } = string.Empty;
        public required List<string> Roles { get; set; }
        public DateTime JoinDate { get; set; }
        
        public bool? Gender { get; set; }
        public int? SchoolId { get; set; }
        public string? Address { get; set; }
        public int? CommuneId { get; set; }
        public string? PhoneNumber { get; set; }

        public long Wallet { get; set; }
    }
}
