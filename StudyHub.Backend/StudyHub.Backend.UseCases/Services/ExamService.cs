using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.UseCases.Repositories.Exam;

namespace StudyHub.Backend.UseCases.Services
{
    public class ExamService
    {
        private readonly IQuestionRepository _questionRepo;
        private readonly IExamRepository _examRepo;
        //private readonly IExamResultRepository _examResultRepo;
        public ExamService(IQuestionRepository questionRepo, IExamRepository examRepo) //, IExamResultRepository examResultRepo
        {
            _questionRepo = questionRepo;
            _examRepo = examRepo;
            //_examResultRepo = examResultRepo;
        }

        public List<Question> GetAllQuestions()
        {
            return _questionRepo.GetAllQuestions();
        }

        public List<Exam> GetAllClassExamsByStudent(Guid studentId)
        {
            return _examRepo.GetAllClassExamsByStudent(studentId);
        }

        public List<Exam> GetAllClassExamsByTeacher(Guid teacherId)
        {
            return _examRepo.GetAllClassExamsByTeacher(teacherId);
        }

        public List<Exam> GetAllClassExams(int classId)
        {
            return _examRepo.GetAllClassExams(classId);
        }

        public Exam? GetLessonExam(int lessonId)
        {
            return _examRepo.GetLessonExam(lessonId);
        }

        public string GetClassName(int classId)
        {
            return _examRepo.GetClassName(classId);
        }

        public string GetLessonName(int lessonId)
        {
            return _examRepo.GetLessonName(lessonId);
        }

        public Exam? GetExamById(int id)
        {
            var exam = _examRepo.GetExamById(id);
            if (exam == null)
            {
                return null;
            }
            var questionObjectIds = _examRepo.GetExamQuestionObjectIds(id);
            var questions = _questionRepo.GetManyQuestionsById(questionObjectIds);
            exam.Questions = questions;
            return exam;
        }

        public bool? IsLessonExamExists(int lessonId)
        {
            return _examRepo.IsLessonExamExists(lessonId);
        }

        public bool CreateExam(Exam examEntity)
        {
            List<string> questionObjectIds = _questionRepo.AddManyQuestions(examEntity.Questions);
            if (questionObjectIds.Count == 0)
            {
                return false;
            }
            bool success = _examRepo.CreateExam(examEntity, questionObjectIds);
            return success;
        }

        public bool UpdateExam(Exam examEntity)
        {
            return _examRepo.UpdateExam(examEntity);
        }

        public bool UpdateExamQuestions(int examId, List<string> questionObjectIds)
        {
            return _examRepo.UpdateExamQuestions(examId, questionObjectIds);
        }

        public List<string> UpdateExamQuestions(int examId, List<Question> questions)
        {
            List<string> objectIdsFromDb = _examRepo.GetExamQuestionObjectIds(examId);
            List<string> objectIdsFromApi = questions.Select(x => x.Id).ToList();

            if (objectIdsFromApi.Count == 0 || objectIdsFromApi.Count == 0)
            {
                return [];
            }

            List<string> removeObjectIds = objectIdsFromDb.Except(objectIdsFromApi).ToList();
            List<string> updateObjectIds = objectIdsFromApi.Where(id => id != string.Empty).Intersect(objectIdsFromDb).ToList();

            var questionsToAdd = questions.Where(q => q.Id == string.Empty).ToList();
            List<string> addObjectIds = [];
            if (questionsToAdd.Count > 0)
            {
                addObjectIds = _questionRepo.AddManyQuestions(questionsToAdd);
            }

            bool isDeleted = false, isUpdated = false;

            if (removeObjectIds.Count > 0)
            {
                isDeleted = _questionRepo.DeleteManyQuestions(removeObjectIds);
            }

            if (updateObjectIds.Count > 0)
            {
                var questionsToUpdate = questions.Where(q => updateObjectIds.Contains(q.Id)).ToList();
                isUpdated = _questionRepo.UpdateManyQuestions(questionsToUpdate);
            }

            return addObjectIds.Concat(updateObjectIds).ToList();
        }
    }
}
