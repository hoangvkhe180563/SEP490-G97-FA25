using StudyHub.Backend.Domain.Entities.Exam;

namespace StudyHub.Backend.UseCases.Repositories.Exam
{
    public interface IAnswerRepository
    {
        public List<ExamAnswer> GetAnswersByResultId(string resultId, bool showAnswers, bool showCorrectAnswers);
    }
}
