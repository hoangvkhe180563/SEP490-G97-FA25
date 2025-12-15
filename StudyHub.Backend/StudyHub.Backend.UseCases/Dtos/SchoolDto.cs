namespace StudyHub.Backend.UseCases.Dtos
{
    public class SchoolDto
    {
        public int SchoolId { get; set; }
        public string SchoolName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string BannerUrl { get; set; } = string.Empty;
        public string LogoUrl { get; set; } = string.Empty;
        public int CommuneId { get; set; }
        public string Address { get; set; } = string.Empty;
    }
}
