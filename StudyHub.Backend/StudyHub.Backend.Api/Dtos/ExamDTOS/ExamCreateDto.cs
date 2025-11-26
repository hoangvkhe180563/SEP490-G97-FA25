using StudyHub.Backend.Api.Dtos.QuestionDTOS;
using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Dtos.ExamDTOS
{
    public class ExamCreateDto
    {

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
        public Guid CreatedBy { get; set; }

        [Required]
        public bool ShowAnswers { get; set; } = true;

        [Required]
        public bool ShowCorrectAnswers { get; set; }
        [Required]
        public bool IsMultipleAttempts { get; set; }
        public int? ClassId { get; set; }
        public int? LessonId { get; set; }

        [Required]
        public DateTime OpenTime { get; set; }
        public DateTime? CloseTime { get; set; }

        [Required(ErrorMessage = "Phải có ít nhất một câu hỏi!")]
        public List<QuestionCreateDto> Questions { get; set; } = new List<QuestionCreateDto>();
        public sbyte? NoRandomQuestions { get; set; }
        public sbyte? Grade { get; set; }
        public short? SubjectId { get; set; }
    }
}
