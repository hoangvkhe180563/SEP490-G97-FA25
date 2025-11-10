namespace StudyHub.Backend.Api.Dtos.AppUserDTOS
{
    public class EditAccountRequest
    {
        public string? Email { get; set; }
        public string? Username { get; set; }
        public string? Fullname { get; set; }
        public List<Guid>? RoleIds { get; set; }
        public int? CommuneId { get; set; }
        public bool? Status { get; set; }
        public IFormFile? AvatarFile { get; set; }
    public DateOnly? Dob { get; set; }
        // Gender: 1 -> Male, 0 -> Female
        public int? Gender { get; set; }
        public int? SchoolId { get; set; }
        public string? Address { get; set; }
        public string? PhoneNumber { get; set; }

    }
}
