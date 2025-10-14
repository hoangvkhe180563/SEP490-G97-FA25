using System;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.Api.Dtos
{
    public class SignupRequest
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string? Fullname { get; set; }
        public int CommuneId { get; set; }
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

    public class LoginResponse
    {
        public bool Success { get; set; }

        public string Message { get; set; } = null!;
        public UserInfoResponse Data { get; set; } = null!;
    }

    public class AuthResponse
    {
        // Deprecated: tokens will be sent in HttpOnly cookies. Keep for compatibility if needed.
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? ExpiresAt { get; set; }
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
    }
}
