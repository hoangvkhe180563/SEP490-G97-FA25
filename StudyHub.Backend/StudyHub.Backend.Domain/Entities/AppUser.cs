namespace StudyHub.Backend.Domain.Entities
{
    public class AppUser
    {
        public Guid Id { get; set; }

        public string Email { get; set; } = null!;

        public string? PasswordHash { get; set; }

        public string Username { get; set; } = null!;

        public string? Fullname { get; set; }

        public int? SchoolId { get; set; }

        public bool? Status { get; set; }

        public Guid RoleId { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public bool EmailConfirmed { get; set; }

        public string? RefreshToken { get; set; }

        public DateTime? RefreshTokenExpire { get; set; }

        public bool? IsLoginWithGoogle { get; set; }

        public string? Address { get; set; }

        public int CommuneId { get; set; }
    }
}
