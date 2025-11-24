using StudyHub.Backend.Domain.Entities.Exam;
using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Dtos.QuestionDTOS
{
    public class QuestionCreateDto
    {

        [Required]
        public string QuestionText { get; set; } = string.Empty;

        [Required]
        public QuestionType Type { get; set; } = QuestionType.SingleChoice;

        public List<string> Options { get; set; } = new List<string>();

        public List<string> Terms { get; set; } = new List<string>();

        public List<string> Definitions { get; set; } = new List<string>();
        public int? SubjectId { get; set; }
        public int? Grade { get; set; }

        [Required(ErrorMessage = "Câu hỏi phải có ít nhất 1 câu trả lời đúng!")]
        public object CorrectAnswer { get; set; }
    }
}
