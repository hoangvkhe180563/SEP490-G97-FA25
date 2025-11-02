namespace StudyHub.Backend.Domain.Entities;

public class AppUser : IAuditTrail
{
    public Guid Id { get; set; }

    public string Email { get; set; } = null!;

    public string? PasswordHash { get; set; }

    public string? Username { get; set; }

    public string? Fullname { get; set; }

    public DateOnly? Dob { get; set; }

    public bool? Gender { get; set; }
    public string? Avatar { get; set; }

    public int? SchoolId { get; set; }
    public int? TransferId { get; set; }

    public string? Address { get; set; }

    public int? CommuneId { get; set; }

    public string? PhoneNumber { get; set; }

    public long Wallet { get; set; }

    public bool IsVerified { get; set; }
    public string? EmailVerificationToken { get; set; }
    public DateTime? EmailVerificationExpire { get; set; }

    public string? RefreshToken { get; set; }

    public DateTime? RefreshTokenExpire { get; set; }

    //// Password reset
    public string? ResetPasswordToken { get; set; }
    public DateTime? ResetPasswordExpire { get; set; }

    public bool IsLoginWithGoogle { get; set; }

    public bool? Status { get; set; }
    public List<AppRole> Roles { get; set; } = new List<AppRole>();
}
