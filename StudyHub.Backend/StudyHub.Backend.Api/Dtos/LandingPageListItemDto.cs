namespace StudyHub.Backend.Api.Dtos
{
    public class LandingPageListItemDto
    {
        public int SchoolId { get; set; }
        public string SchoolName { get; set; } = string.Empty;
        public string SchoolLogoUrl { get; set; } = string.Empty;
    }
}
