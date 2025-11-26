using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Dtos.QuestionDTOS
{
    public class CommonQuestionGetDto
    {
        [Required]
        public int SubjectId { get; set; }
        public int Grade { get; set; }
        public int Page { get; set; } = 1;
        public int Type { get; set; } = -1;
        public string QuestionText { get; set; } = string.Empty;
    }
}
