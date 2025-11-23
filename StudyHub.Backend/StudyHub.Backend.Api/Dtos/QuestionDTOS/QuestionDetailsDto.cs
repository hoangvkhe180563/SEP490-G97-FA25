using StudyHub.Backend.Domain.Entities.Exam;

namespace StudyHub.Backend.Api.Dtos.QuestionDTOS
{
    public class QuestionDetailsDto
    {
        public string QuestionObjectId { get; set; } = string.Empty;
        public string QuestionText { get; set; } = string.Empty;
        public QuestionType Type { get; set; } = QuestionType.SingleChoice;
        public List<string> Options { get; set; } = new List<string>();
        public List<string> Terms { get; set; } = new List<string>();
        public List<string> Definitions { get; set; } = new List<string>();
        public object CorrectAnswer { get; set; } = new object();
    }
}
