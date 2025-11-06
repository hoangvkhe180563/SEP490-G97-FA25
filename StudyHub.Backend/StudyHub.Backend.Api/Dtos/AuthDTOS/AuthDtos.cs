using System;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.Api.Dtos.AuthDTOS
{
    using System.ComponentModel.DataAnnotations;

    public class SignupRequest
    {
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        public string Password { get; set; } = null!;

        [Required(ErrorMessage = "Username là bắt buộc")]
        public string Username { get; set; } = null!;

        public string? Fullname { get; set; }

        [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
        [RegularExpression("^(\\+84|0)(3|5|7|8|9|1[2689])\\d{8}$", ErrorMessage = "Số điện thoại không hợp lệ (Việt Nam)")]
        public string PhoneNumber { get; set; } = null!;

        [Range(1, int.MaxValue, ErrorMessage = "CommuneId là bắt buộc")]
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
        public string Username { get; set; } = null!;
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
        public string? Username { get; set; }
        public string? Fullname { get; set; }
        public string? Avatar { get; set; }
        public List<string> Roles { get; set; } = new();
        public List<string> Permissions { get; set; } = new();
        public List<int> ClassIds { get; set; } = new();
        public List<short> SubjectIds { get; set; } = new();
        public int? SchoolId { get; set; }
        public int? transferId { get; set; }

        public long Wallet { get; set; }

    }

    public class GenericResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = null!;
        public UserInfoResponse? Data { get; set; }
    }
}
