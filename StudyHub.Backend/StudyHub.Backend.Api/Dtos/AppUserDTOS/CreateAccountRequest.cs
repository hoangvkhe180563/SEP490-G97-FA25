namespace StudyHub.Backend.Api.Dtos.AppUserDTOS
{
    public class CreateAccountRequest
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string Username { get; set; } = null!;
        public List<Guid> RoleIds { get; set; } = new();
        public int CommuneId { get; set; }
        public IFormFile? AvatarFile { get; set; }
        public string? Fullname { get; set; }
        // Gender: 1 -> Male, 0 -> Female
        public int Gender { get; set; }
        public int SchoolId { get; set; }
    }
}
