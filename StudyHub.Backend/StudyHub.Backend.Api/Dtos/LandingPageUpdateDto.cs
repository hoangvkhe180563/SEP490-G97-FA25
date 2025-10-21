using StudyHub.Backend.Api.Dtos;
using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Controllers
{
    public class LandingPageUpdateDto
    {
        [Required]
        public int SchoolId { get; set; }
        [Required]
        public string BannerUrl { get; set; } = string.Empty;
        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
        public List<string> LandingPageImages { get; set; } = new();
        public List<int> FeaturedTeacherIds { get; set; } = new();
        public List<int> FeaturedDocumentIds { get; set; } = new();
        public List<int> FeaturedCourseIds { get; set; } = new();
    }
}