namespace StudyHub.Backend.UseCases.Repositories.Exam
{
    public interface IExamRepository
    {
        List<Domain.Entities.Exam.Exam> GetAllClassExams(int classId);
        Domain.Entities.Exam.Exam? GetLessonExam(int lessonId);
        public List<Domain.Entities.Exam.Exam> GetAllClassExamsByStudent(Guid studentId);
        string GetClassName(int classId);
        Domain.Entities.Exam.Exam? GetExamById(int id);
        List<string> GetExamQuestionObjectIds(int examId);
        bool CreateExam(Domain.Entities.Exam.Exam examEntity, List<string> questionObjectIds);
        bool UpdateExam(Domain.Entities.Exam.Exam examEntity);
        bool UpdateExamQuestions(int examId, List<string> questionObjectIds);
        int GetExamIdByResultId(string resultId);

        int GetCourseIdByLessonId(int lessonId);
    }
}
