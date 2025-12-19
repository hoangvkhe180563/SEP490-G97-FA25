namespace StudyHub.Backend.UseCases.Dtos
{
    public class SchoolEditFormDto
    {
        public int Id { get; set; }
        public string SchoolName { get; set; } = string.Empty;
        public int CommuneId { get; set; }
        public int CityId { get; set; }
        public string BannerUrl { get; set; } = null!;
        public string LogoUrl { get; set; } = null!;
        public string Description { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public List<string> LandingPageImages { get; set; } = new();
        public List<int> FeaturedDocumentIds { get; set; } = new();
        public List<int> FeaturedCourseIds { get; set; } = new();
        public string AccountName { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public int ExchangeRate { get; set; }
        public string AccountBank { get; set; } = string.Empty;
    }
}
