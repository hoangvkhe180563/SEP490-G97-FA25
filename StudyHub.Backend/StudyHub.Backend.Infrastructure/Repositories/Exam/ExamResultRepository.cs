using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories.Exam;

namespace StudyHub.Backend.Infrastructure.Repositories.Exam
{
    public class ExamResultRepository : IExamResultRepository
    {
        private readonly AppDbContext _context;
        public ExamResultRepository(AppDbContext context)
        {
            _context = context;
        }
        public List<string> GetExamResultObjectIds(int examId)
        {
            try
            {
                return _context.ExamResults.Where(q => q.ExamId == examId).Select(q => q.ResultObjectId).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamResultRepository", "GetExamResultObjectIds exception. Inner error: " + ex.Message).LogError();
            }
            return [];
        }

        public Domain.Entities.Exam.ExamResult? GetExamResultById(string id)
        {
            try
            {
                var result = _context.ExamResults.Include(r => r.Student).FirstOrDefault(r => r.ResultObjectId == id);
                if (result == null) return null;
                return new Domain.Entities.Exam.ExamResult
                {
                    Id = result.ResultObjectId,
                    ExamId = result.ExamId,
                    StudentId = result.StudentId,
                    StudentName = result.Student.Fullname ?? "",
                    FinishTime = result.FinishTime,
                    SubmissionTime = result.SubmissionTime.GetValueOrDefault(),
                    CheatTimes = result.CheatTimes,
                    Score = result.Score
                };
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamResultRepository", "GetExamResultById exception. Inner error: " + ex.Message).LogError();
            }
            return null;
        }

        public List<Domain.Entities.Exam.ExamResult> GetExamResultsByExamId(int examId)
        {
            try
            {
                var result = _context.ExamResults.Include(r => r.Student).Where(r => r.ExamId == examId)
                    .Select(r => new Domain.Entities.Exam.ExamResult
                    {
                        Id = r.ResultObjectId,
                        ExamId = r.ExamId,
                        StudentId = r.StudentId,
                        StudentName = r.Student.Fullname ?? "",
                        FinishTime = r.FinishTime,
                        SubmissionTime = r.SubmissionTime.GetValueOrDefault(),
                        CheatTimes = r.CheatTimes,
                        Score = r.Score
                    })
                    .ToList();

                return result;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamResultRepository", "GetExamResultsByExamId exception. Inner error: " + ex.Message).LogError();
            }
            return [];
        }
    }
}
