using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.Api.Dtos.ClassDTOS
{
    public class MemberDto
    {
        public Guid UserId { get; set; }
        public string Fullname { get; set; } = string.Empty;
        public required List<string> Roles { get; set; }
        public DateTime JoinDate { get; set; }
        public string Email { get; set; }
        public bool? Gender { get; set; }



        public string SchoolName { get; set; }
        public string Communes { get; set; }

        public int? SchoolId { get; set; }
        public string? Address { get; set; }
        public int? CommuneId { get; set; }
        public string? PhoneNumber { get; set; }

        public long Wallet { get; set; }
    }
}
