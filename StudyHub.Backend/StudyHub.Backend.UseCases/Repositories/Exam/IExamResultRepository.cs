using StudyHub.Backend.Domain.Entities.Exam;

namespace StudyHub.Backend.UseCases.Repositories.Exam
{
    public interface IExamResultRepository
    {
        List<string> GetExamResultObjectIds(int examId);
        ExamResult? GetExamResultById(string id);
        List<ExamResult> GetExamResultsByExamId(int examId);
    }
}
