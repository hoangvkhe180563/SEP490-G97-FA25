namespace StudyHub.Backend.Domain.Entities;

public class LandingPage
{
    public int SchoolId { get; set; }
    public string BannerUrl { get; set; } = string.Empty;
    public string SchoolLogo { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> LandingPageImages { get; set; } = new();
    public List<AppUser> FeaturedTeachers { get; set; } = new();
    public List<Document> FeaturedDocuments { get; set; } = new();
    public List<Course> FeaturedCourses { get; set; } = new();
}
