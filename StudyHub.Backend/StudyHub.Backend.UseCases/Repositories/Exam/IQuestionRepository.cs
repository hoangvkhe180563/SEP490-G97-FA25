using StudyHub.Backend.Domain.Entities.Exam;

namespace StudyHub.Backend.UseCases.Repositories.Exam
{
    public interface IQuestionRepository
    {
        public List<Question> GetAllQuestions();
        public Question? GetQuestionById(string id);
        public List<string> AddManyQuestions(List<Question> questions);
        public bool UpdateOneQuestion(Question question);
        public bool UpdateManyQuestions(List<Question> questions);
        public bool DeleteQuestion(string id);
        public bool DeleteManyQuestions(List<string> ids);
        public List<Question> GetManyQuestionsById(List<string> ids);
        List<Question> GetCommonQuestions(int subjectId, int grade, int page, int type, string questionText);
        int GetTotalQuestions(int subjectId, int grade, int type, string questionText);
        List<Question> GenerateRandomQuestions(sbyte noRandomQuestions, short subjectId, sbyte grade);
    }
}
