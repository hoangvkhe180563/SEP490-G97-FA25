using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Dtos.ExamDTOS
{
    public class ExamUpdateDto
    {
        public int Id { get; set; }
        [Required]
        [StringLength(500)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Thời gian làm bài phải > 0!")]
        public uint Duration { get; set; }

        [Required]
        public bool ShowAnswers { get; set; } = true;

        [Required]
        public bool ShowCorrectAnswers { get; set; }
        [Required]
        public bool IsMultipleAttempts { get; set; }

        [Required]
        public DateTime OpenTime { get; set; }
        public DateTime? CloseTime { get; set; }
        public List<string> QuestionObjectIds { get; set; } = new List<string>();
    }
}
