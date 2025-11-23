using StudyHub.Backend.Domain.Entities.Exam;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class QuestionExcelDto
    {
        public List<Question> Questions { get; set; } = new List<Question>();
        public List<string> ErrorMessages { get; set; } = new List<string>();
    }
}
