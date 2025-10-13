namespace StudyHub.Backend.Domain.Entities
{
    public class LandingPage
    {
        public int Id { get; set; }
        public int SchoolId { get; set; }
        public string SchoolLogoUrl { get; set; } = string.Empty;
        public sbyte PrimaryColor { get; set; }
        public List<Teacher> FeaturedTeachers { get; set; } = new();
        public List<Document> FeaturedDocuments { get; set; } = new();
        public List<Course> FeaturedCourses { get; set; } = new();
    }
}
