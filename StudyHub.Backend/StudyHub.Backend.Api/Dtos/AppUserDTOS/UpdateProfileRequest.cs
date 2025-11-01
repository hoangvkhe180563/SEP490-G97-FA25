using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Dtos.AppUserDTOS
{
    public class UpdateProfileRequest
    {
        public string? Email { get; set; }
        public string? Username { get; set; }
        public string? OldPassword { get; set; }
        public string? NewPassword { get; set; }
        public string? Fullname { get; set; }
        public int? CommuneId { get; set; }
        public IFormFile? AvatarFile { get; set; }
        // Gender: 1 -> Male, 0 -> Female
        public int? Gender { get; set; }
        public int? SchoolId { get; set; }
    }
}
