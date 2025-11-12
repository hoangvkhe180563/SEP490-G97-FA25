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
        public DateTime OpenTime { get; set; }
        public DateTime? CloseTime { get; set; }
        public List<string> QuestionObjectIds { get; set; } = new List<string>();
    }

    public class QuestionUpdateDto
    {
        public string QuestionObjectId { get; set; } = string.Empty;

        [Required]
        public string QuestionText { get; set; } = string.Empty;

        [Required]
        public string Type { get; set; } = string.Empty;

        public List<string> Options { get; set; } = new List<string>();

        public List<string> Terms { get; set; } = new List<string>();

        public List<string> Definitions { get; set; } = new List<string>();

        [Required(ErrorMessage = "Câu hỏi phải có ít nhất 1 câu trả lời đúng!")]
        public object CorrectAnswer { get; set; }
    }
}
