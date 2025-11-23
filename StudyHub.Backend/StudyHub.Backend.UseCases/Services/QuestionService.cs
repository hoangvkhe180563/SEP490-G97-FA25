using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.UseCases.Exceptions;
using StudyHub.Backend.UseCases.Repositories.Exam;

namespace StudyHub.Backend.UseCases.Services
{
    public class QuestionService
    {
        private readonly IQuestionRepository _questionRepo;
        private readonly IQuestionManagerRepository _questionManagerRepo;
        public QuestionService(IQuestionRepository questionRepo, IQuestionManagerRepository questionManagerRepo)
        {
            _questionRepo = questionRepo;
            _questionManagerRepo = questionManagerRepo;
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

        public List<Question> GetCommonQuestions(int subjectId, int grade, int page, int type, string questionText)
        {
            List<Question> questionList = _questionRepo.GetCommonQuestions(subjectId, grade, page, type, questionText);
            return questionList;
        }

        public bool UpdateCommonQuestion(Question questionEntity)
        {
            return _questionRepo.UpdateOneQuestion(questionEntity);
        }

        public List<Subject> GetManagerSubjects(Guid managerId)
        {
            return _questionManagerRepo.GetSubjectsByManagerId(managerId);
        }

        public Question? GetQuestionById(string id)
        {
            return _questionRepo.GetQuestionById(id);
        }

        public int GetTotalQuestions(int subjectId, int grade, int type, string questionText)
        {
            return _questionRepo.GetTotalQuestions(subjectId, grade, type, questionText);
        }
    }
}
