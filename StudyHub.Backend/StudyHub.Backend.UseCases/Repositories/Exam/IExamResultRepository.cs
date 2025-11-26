using StudyHub.Backend.Domain.Entities.Exam;

namespace StudyHub.Backend.UseCases.Repositories.Exam
{
    public interface IExamResultRepository
    {
        List<string> GetExamResultObjectIds(int examId);
        ExamResult? GetExamResultById(string id);
        List<ExamResult> GetExamResultsByExamId(int examId);
        bool CheckExamStatus(int examId, Guid studentId);
        List<ExamResult> GetResultsByExamIdAndStudentId(int examId, Guid studentId);
        bool CreateExamResult(ExamResult result);
        bool UpdateExamResult(ExamResult result);
        bool? CheckIfResultIsSubmitted(string resultId);
        bool SubmitExam(ExamResult result);
        int GetEnrollmentId(string resultId, int lessonId);
        bool CreateProgress(int enrollmentId, int lessonId);
        List<ExamResult> GetResultsByStudentId(Guid studentId);
    }
}
