namespace StudyHub.Backend.Api.Dtos.AppUserDTOS
{
    using StudyHub.Backend.UseCases.Dtos;

    public class ProfileResponse
    {
        public string Email { get; set; } = null!;
        public string? Username { get; set; }
        public string? Fullname { get; set; }
        public DateOnly? Dob { get; set; }
        // Gender friendly string: "Male" or "Female"
        public bool? Gender { get; set; }
        public string? Avatar { get; set; }
        public string? Address { get; set; }
        public string? PhoneNumber { get; set; }
        public bool? Status { get; set; }
        public string CreatedAt { get; set; } = null!;
        public string? UpdatedAt { get; set; }
        public int? SchoolId { get; set; }
        public string? SchoolName { get; set; }
        public int? CityId { get; set; }
        public string? CityName { get; set; }
        public List<string> Roles { get; set; } = new();
        public int? CommuneId { get; set; }
        public string? CommuneName { get; set; }
        // Subjects assigned to the user (for teachers)
        public List<SubjectDto> Subjects { get; set; } = new();
    }
}
