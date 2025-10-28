using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Controllers
{
    public class LandingPageUpdateDto
    {
        [Required]
        public int SchoolId { get; set; }
        public IFormFile? BannerFile { get; set; }
        public IFormFile? SchoolLogoFile { get; set; }
        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
        public List<IFormFile> LandingPageNewImages { get; set; } = new();
        public List<string> LandingPageDeleteImages { get; set; } = new();
        public List<int> FeaturedTeacherIds { get; set; } = new();
        public List<int> FeaturedDocumentIds { get; set; } = new();
        public List<int> FeaturedCourseIds { get; set; } = new();
    }
}