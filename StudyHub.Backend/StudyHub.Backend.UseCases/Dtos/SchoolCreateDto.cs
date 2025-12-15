using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class SchoolCreateDto
    {
        [MaxLength(200)]
        public string SchoolName { get; set; } = string.Empty;
        [Required]
        public int CommuneId { get; set; }
        [Required]
        public IFormFile Banner { get; set; } = null!;
        [Required]
        public IFormFile Logo { get; set; } = null!;
        [Required]
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;
        [Required]
        [MaxLength(1000)]
        public string Address { get; set; } = string.Empty;
        [Required]
        public List<IFormFile> NewLandingPageImages { get; set; } = null!;
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
