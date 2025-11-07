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

        public bool CheckExamStatus(int examId, Guid studentId)
        {
            try
            {
                return _context.ExamResults.Any(r => r.ExamId == examId && r.StudentId == studentId);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamResultRepository", "CheckExamStatus exception. Inner error: " + ex.Message).LogError();
            }
            return false;
        }

        public List<Domain.Entities.Exam.ExamResult> GetResultsByExamIdAndStudentId(int examId, Guid studentId)
        {
            try
            {
                var results = _context.ExamResults.Include(r => r.Student).Where(r => r.ExamId == examId && r.StudentId == studentId);
                return results.Select(r => new Domain.Entities.Exam.ExamResult
                {
                    Id = r.ResultObjectId,
                    StudentId = r.StudentId,
                    StudentName = r.Student.Fullname ?? "",
                    ExamId = r.ExamId,
                    FinishTime = r.FinishTime,
                    SubmissionTime = r.SubmissionTime.GetValueOrDefault(),
                    Score = r.Score,
                    CheatTimes = r.CheatTimes,
                }).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamResultRepository", "GetResultsByExamIdAndStudentId exception. Inner error: " + ex.Message).LogError();
            }
            return [];
        }

        public bool CreateExamResult(Domain.Entities.Exam.ExamResult result)
        {
            try
            {
                var resultData = new ExamResult
                {
                    ResultObjectId = result.Id,
                    ExamId = result.ExamId,
                    FinishTime = result.FinishTime,
                    StudentId = result.StudentId,
                    Score = 0,
                    CheatTimes = 0
                };
                _context.ExamResults.Add(resultData);
                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamResultRepository", "GetResultsByExamIdAndStudentId exception. Inner error: " + ex.Message).LogError();
            }
            return false;
        }

        public bool UpdateExamResult(Domain.Entities.Exam.ExamResult result)
        {
            try
            {
                var existingResult = _context.ExamResults.FirstOrDefault(r => r.ResultObjectId == result.Id);
                if (existingResult == null)
                {
                    return false;
                }
                existingResult.CheatTimes = result.CheatTimes;
                _context.ExamResults.Update(existingResult);
                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamResultRepository", "UpdateExamResult exception. Inner error: " + ex.Message).LogError();
            }
            return false;
        }

        public bool? CheckIfResultIsSubmitted(string resultId)
        {
            try
            {
                return _context.ExamResults.Any(r => r.ResultObjectId == resultId && r.SubmissionTime != null);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamResultRepository", "CheckIfResultIsSubmitted exception. Inner error: " + ex.Message).LogError();
            }
            return null;
        }

        public bool SubmitExam(Domain.Entities.Exam.ExamResult result)
        {
            try
            {
                var resultData = _context.ExamResults.FirstOrDefault(r => r.ResultObjectId == result.Id);
                if (resultData == null)
                {
                    throw new Exception("Result data is null");
                }
                resultData.SubmissionTime = result.SubmissionTime;
                resultData.Score = result.Score;

                _context.ExamResults.Update(resultData);
                _context.SaveChanges();

                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamResultRepository", "SubmitExam exception. Inner error: " + ex.Message).LogError();
            }
            return false;
        }
    }
}
