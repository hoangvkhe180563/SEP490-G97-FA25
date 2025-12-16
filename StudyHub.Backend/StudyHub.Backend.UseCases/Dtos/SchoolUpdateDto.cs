using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class SchoolUpdateDto
    {
        [Required]
        public int Id { get; set; }
        [MaxLength(200)]
        public string SchoolName { get; set; } = string.Empty;
        [Required]
        public int CommuneId { get; set; }
        public IFormFile? Banner { get; set; }
        public IFormFile? Logo { get; set; }
        [Required]
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;
        [Required]
        [MaxLength(1000)]
        public string Address { get; set; } = string.Empty;
        [Required]
        public List<string> CurrentLandingPageImages { get; set; } = new();
        [Required]
        public List<IFormFile> NewLandingPageImages { get; set; } = new();
        [Required]
        public List<int> FeaturedDocumentIds { get; set; } = new();
        [Required]
        public List<int> FeaturedCourseIds { get; set; } = new();
        [Required]
        [MaxLength(100)]
        public string AccountName { get; set; } = string.Empty;
        [Required]
        [MaxLength(20)]
        public string AccountNumber { get; set; } = string.Empty;
        [Required]
        public int ExchangeRate { get; set; }
        [Required]
        [MaxLength(20)]
        public string AccountBank { get; set; } = string.Empty;
    }
}
