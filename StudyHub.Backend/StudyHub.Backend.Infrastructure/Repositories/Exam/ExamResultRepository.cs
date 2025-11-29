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

        public int GetEnrollmentId(string resultId, int lessonId)
        {
            try
            {
                var examResult = GetExamResultById(resultId);
                if (examResult == null) return 0;
                Guid studentId = examResult.StudentId;

                int courseId = _context.Lessons
                    .Where(l => l.Id == lessonId)
                    .Select(l => l.Chapter.CourseId)
                    .FirstOrDefault();

                var enrollment = _context.Enrollments.FirstOrDefault(e => e.AppUserId == studentId && e.CourseId == courseId);
                return enrollment?.Id ?? 0;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamResultRepository", "GetEnrollmentId exception. Inner error: " + ex.Message).LogError();
            }
            return 0;
        }

        public bool CreateProgress(int enrollmentId, int lessonId)
        {
            try
            {
                var progress = new Progress
                {
                    EnrollmentId = enrollmentId,
                    LessonId = lessonId,
                    CompletionDate = DateTime.Now
                };

                _context.Progresses.Add(progress);
                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamResultRepository", "CreateProgress exception. Inner error: " + ex.Message).LogError();
            }
            return false;
        }

        public string GetResultIdByLessonId(int lessonId, Guid studentId)
        {
            try
            {
                var exam = _context.Exams.FirstOrDefault(e => e.LessonId == lessonId);
                if (exam == null) return string.Empty;

                var result = _context.ExamResults.FirstOrDefault(er => er.ExamId == exam.Id && er.StudentId == studentId);
                if (result == null) return string.Empty;

                return result.ResultObjectId;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamResultRepository", "GetResultIdByLessonId exception. Inner error: " + ex.Message).LogError();
            }
            return string.Empty;
        }
    }
}
