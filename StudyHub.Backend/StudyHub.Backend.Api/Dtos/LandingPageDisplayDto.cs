namespace StudyHub.Backend.Api.Dtos
{
    public class LandingPageDisplayDto
    {
        public string BannerUrl { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> LandingPageImages { get; set; } = new();
        public List<LandingPageTeacherDisplayDto> FeaturedTeachers { get; set; } = new();
        public List<LandingPageDocumentDisplayDto> FeaturedDocuments { get; set; } = new();
        public List<LandingPageCourseDisplayDto> FeaturedCourses { get; set; } = new();
    }

    public class LandingPageTeacherDisplayDto
    {
        public string Name { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
    }

    public class LandingPageDocumentDisplayDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string SubjectName { get; set; } = string.Empty;
        public int Grade { get; set; }
        public string Thumbnail { get; set; } = string.Empty;
        public int DocumentCategory { get; set; }
    }

    public class LandingPageCourseDisplayDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string SubjectName { get; set; } = string.Empty;
        public int Grade { get; set; }
        public string Thumbnail { get; set; } = string.Empty;
    }

    public class LandingPageDocumentEditDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string SubjectName { get; set; } = string.Empty;
        public int Grade { get; set; }
        public bool IsFeatured { get; set; }
    }

    public class LandingPageCourseEditDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string SubjectName { get; set; } = string.Empty;
        public int Grade { get; set; }
        public bool IsFeatured { get; set; }
    }
}
