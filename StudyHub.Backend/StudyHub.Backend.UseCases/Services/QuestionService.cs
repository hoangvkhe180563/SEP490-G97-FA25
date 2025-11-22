using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.UseCases.Exceptions;
using StudyHub.Backend.UseCases.Repositories.Exam;

namespace StudyHub.Backend.UseCases.Services
{
    public class QuestionService
    {
        private readonly IQuestionRepository _questionRepo;
        public QuestionService(IQuestionRepository questionRepo)
        {
            _questionRepo = questionRepo;
        }

        public List<string> AddCommonQuestions(List<Question> questions)
        {
            List<string> questionObjectIds = _questionRepo.AddManyQuestions(questions);
            return questionObjectIds;
        }

        public bool DeleteCommonQuestion(string questionObjectId)
        {
            var question = _questionRepo.GetQuestionById(questionObjectId);
            if (question == null)
            {
                new UseCaseException("QuestionService", "DeleteCommonQuestion failed. Question is null").LogError();
            }
            bool result = _questionRepo.DeleteQuestion(questionObjectId);
            return result;
        }

        public List<Question> GetCommonQuestions(int subjectId, int grade, int page, int pageSize)
        {
            List<Question> questionList = _questionRepo.GetCommonQuestions(subjectId, grade, page, pageSize);
            return questionList;
        }

        public bool UpdateCommonQuestion(Question questionEntity)
        {
            return _questionRepo.UpdateOneQuestion(questionEntity);
        }
    }
}
