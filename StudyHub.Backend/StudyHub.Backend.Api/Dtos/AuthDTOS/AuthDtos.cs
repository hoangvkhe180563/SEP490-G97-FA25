using System;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.Api.Dtos.AuthDTOS
{
    public class SignupRequest
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string? Fullname { get; set; }
        public int CommuneId { get; set; }
        public int? SchoolId { get; set; }
    }

    public class SignupResponse
    {
        public bool Success { get; set; }

        public string Message { get; set; } = null!;
        public AppUser Data { get; set; } = null!;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    public class RefreshRequest
    {
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class ForgotPasswordRequest
    {
        public string Email { get; set; } = null!;
    }

    public class ResetPasswordRequest
    {
        public string ResetToken { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }

    public class GoogleLoginRequest
    {
        public string IdToken { get; set; } = null!;
    }

    public class LoginResponse
    {
        public bool Success { get; set; }

        public string Message { get; set; } = null!;
        public UserInfoResponse Data { get; set; } = null!;
    }

    // Response returned to client after login: contains user info and roles/claims. Tokens are in cookies.
    public class UserInfoResponse
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string Username { get; set; } = null!;
        public List<string> Roles { get; set; } = new();
        public List<string> Permissions { get; set; } = new();
        public List<int> ClassIds { get; set; } = new();
        public List<short> SubjectIds { get; set; } = new();
        public int? SchoolId { get; set; }
    }

    // DTOs for admin account management
    public class CreateAccountRequest
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string Username { get; set; } = null!;
        public List<Guid> RoleIds { get; set; } = new();
        public int CommuneId { get; set; }
        public string? Fullname { get; set; }
        public string? Avatar { get; set; }
        // Gender: 1 -> Male, 0 -> Female
        public int Gender { get; set; }
    }

    public class EditAccountRequest
    {
        public string? Email { get; set; }
        public string? Username { get; set; }
        public string? Fullname { get; set; }
        public List<Guid>? RoleIds { get; set; }
        public int? CommuneId { get; set; }
        public bool? Status { get; set; }
        public string? Avatar { get; set; }
        // Gender: 1 -> Male, 0 -> Female
        public int? Gender { get; set; }
    }

    public class GenericResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = null!;
        public UserInfoResponse? Data { get; set; }
    }

    public class UserListDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string? Fullname { get; set; }
        public string? Address { get; set; }
        public string Status { get; set; } = null!; // Active/Inactive
        public string CreatedAt { get; set; } = null!; // yyyy/MM/dd
        public string UpdatedAt { get; set; } = null!; // yyyy/MM/dd
        public string? SchoolName { get; set; }
        public List<string> Roles { get; set; } = new();
        public string? CommuneName { get; set; }
    }
}
