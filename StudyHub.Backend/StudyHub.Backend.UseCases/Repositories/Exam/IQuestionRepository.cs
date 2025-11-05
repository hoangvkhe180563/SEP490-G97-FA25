using StudyHub.Backend.Domain.Entities.Exam;

namespace StudyHub.Backend.UseCases.Repositories.Exam
{
    public interface IQuestionRepository
    {
        public List<Question> GetAllQuestions();
        public QuestionType GetQuestionType(string id);
        public List<string> AddManyQuestions(List<Question> questions);
        public bool UpdateManyQuestions(List<Question> questions);
        public bool DeleteManyQuestions(List<string> ids);
        public List<Question> GetManyQuestionsById(List<string> ids);
    }
}
