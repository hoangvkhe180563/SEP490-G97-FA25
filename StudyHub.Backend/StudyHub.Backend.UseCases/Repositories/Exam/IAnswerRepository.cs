using StudyHub.Backend.Domain.Entities.Exam;

namespace StudyHub.Backend.UseCases.Repositories.Exam
{
    public interface IAnswerRepository
    {
        string AddManyAnswers(List<ExamAnswer> answers);
        public List<ExamAnswer> GetAnswersByResultId(string resultId, bool showAnswers, bool showCorrectAnswers);
        List<string> GetQuestionIdsByResult(string resultId);
        bool UpdateManyAnswers(string resultObjectId, List<ExamAnswer> answers, bool isSubmission = false);
    }
}
