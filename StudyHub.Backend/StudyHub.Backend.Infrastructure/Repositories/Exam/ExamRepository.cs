using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories.Exam;
using System;
using System.Diagnostics;

namespace StudyHub.Backend.Infrastructure.Repositories.Exam
{
    public class ExamRepository : IExamRepository
    {
        private readonly AppDbContext _context;
        public ExamRepository(AppDbContext context)
        {
            _context = context;
        }

        public bool CreateExam(Domain.Entities.Exam.Exam examEntity, List<string> questionObjectIds)
        {
            var transaction = _context.Database.BeginTransaction();
            try
            {
                var exam = new Data.Exam
                {
                    Title = examEntity.Title,
                    Description = examEntity.Description,
                    Duration = examEntity.Duration,
                    CreatedBy = examEntity.CreatedBy,
                    ShowAnswers = examEntity.ShowAnswers,
                    ShowCorrectAnswers = examEntity.ShowCorrectAnswers,
                    LessonId = examEntity.LessonId == 0 ? null : examEntity.LessonId,
                    ClassId = examEntity.ClassId == 0 ? null : examEntity.ClassId,
                    OpenTime = examEntity.OpenTime,
                    CloseTime = examEntity.CloseTime,
                    IsMultipleAttempts = examEntity.IsMultipleAttempts,
                    NoRandomQuestions = examEntity.NoRandomQuestions,
                    SubjectId = examEntity.SubjectId,
                    Grade = examEntity.Grade
                };
                _context.Add(exam);
                _context.SaveChanges();

                if (questionObjectIds.Count != 0)
                {
                    var questions = questionObjectIds.Select(id => new ExamQuestion
                    {
                        ExamId = exam.Id,
                        QuestionObjectId = id
                    });

                    _context.ExamQuestions.AddRange(questions);
                    _context.SaveChanges();
                }
                transaction.Commit();
                return true;
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                new InfrastructureException("ExamRepository", "CreateExam exception. Inner error: " + ex.Message).LogError();
            }
            return false;
        }

        public List<Domain.Entities.Exam.Exam> GetAllClassExams(int classId)
        {
            try
            {
                var exams = _context.Exams.Include(e => e.ExamQuestions).Where(e => e.ClassId == classId).ToList();
                return exams.Select(e => new Domain.Entities.Exam.Exam
                {
                    Id = e.Id,
                    Title = e.Title,
                    Description = e.Description ?? "",
                    Duration = e.Duration,
                    OpenTime = e.OpenTime,
                    CloseTime = e.CloseTime,
                    ClassId = e.ClassId.GetValueOrDefault(),
                    ShowAnswers = e.ShowAnswers.GetValueOrDefault(),
                    ShowCorrectAnswers = e.ShowCorrectAnswers,
                    TotalQuestions = e.NoRandomQuestions != null ? (int)e.NoRandomQuestions : e.ExamQuestions.Count,
                    IsMultipleAttempts = e.IsMultipleAttempts
                }).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamRepository", "GetAllClassExams exception. Inner error: " + ex.Message).LogError();
            }
            return [];
        }

        public List<Domain.Entities.Exam.Exam> GetAllClassExamsByStudent(Guid studentId)
        {
            try
            {
                List<int> classes = _context.AppUserClasses.Where(item => item.UserId == studentId && item.Status == "joined").Select(item => item.ClassId).Distinct().ToList();
                var exams = _context.Exams.Include(e => e.ExamQuestions).Where(e => e.ClassId != null && classes.Contains(e.ClassId.Value) && DateTime.Now >= e.OpenTime && (e.CloseTime == null || DateTime.Now <= e.CloseTime.Value)).ToList();
                return exams.Select(e => new Domain.Entities.Exam.Exam
                {
                    Id = e.Id,
                    Title = e.Title,
                    Description = e.Description ?? "",
                    Duration = e.Duration,
                    OpenTime = e.OpenTime,
                    CloseTime = e.CloseTime,
                    ClassId = e.ClassId.GetValueOrDefault(),
                    ShowAnswers = e.ShowAnswers.GetValueOrDefault(),
                    ShowCorrectAnswers = e.ShowCorrectAnswers,
                    TotalQuestions = e.NoRandomQuestions != null ? (int)e.NoRandomQuestions : e.ExamQuestions.Count,
                    IsMultipleAttempts = e.IsMultipleAttempts
                }).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamRepository", "GetAllClassExamsByStudent exception. Inner error: " + ex.Message).LogError();
            }
            return [];
        }

        public List<Domain.Entities.Exam.Exam> GetAllClassExamsByTeacher(Guid teacherId)
        {
            try
            {
                var exams = _context.Exams.Include(e => e.ExamQuestions).Where(e => e.ClassId != null && e.CreatedBy == teacherId);
                return exams.Select(e => new Domain.Entities.Exam.Exam
                {
                    Id = e.Id,
                    Title = e.Title,
                    Description = e.Description ?? "",
                    Duration = e.Duration,
                    OpenTime = e.OpenTime,
                    CloseTime = e.CloseTime,
                    ClassId = e.ClassId.GetValueOrDefault(),
                    ShowAnswers = e.ShowAnswers.GetValueOrDefault(),
                    ShowCorrectAnswers = e.ShowCorrectAnswers,
                    TotalQuestions = e.NoRandomQuestions != null ? (int)e.NoRandomQuestions : e.ExamQuestions.Count,
                    IsMultipleAttempts = e.IsMultipleAttempts
                }).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamRepository", "GetAllClassExamsByTeacher exception. Inner error: " + ex.Message).LogError();
            }
            return [];
        }

        public string GetClassName(int classId)
        {
            try
            {
                return _context.Classes.First(c => c.Id == classId).Name;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamRepository", "GetClassName exception. Inner error: " + ex.Message).LogError();
            }
            return string.Empty;
        }

        public Domain.Entities.Exam.Exam? GetExamById(int id)
        {
            try
            {
                var examData = _context.Exams.Include(e => e.ExamQuestions).FirstOrDefault(e => e.Id == id);
                if (examData != null)
                {
                    return new Domain.Entities.Exam.Exam
                    {
                        Id = examData.Id,
                        Title = examData.Title,
                        Description = examData.Description ?? "",
                        Duration = examData.Duration,
                        OpenTime = examData.OpenTime,
                        CloseTime = examData.CloseTime,
                        ClassId = examData.ClassId.GetValueOrDefault(),
                        LessonId = examData.LessonId.GetValueOrDefault(),
                        CreatedBy = examData.CreatedBy,
                        ShowAnswers = examData.ShowAnswers.GetValueOrDefault(),
                        ShowCorrectAnswers = examData.ShowCorrectAnswers,
                        TotalQuestions = examData.NoRandomQuestions != null ? (int)examData.NoRandomQuestions : examData.ExamQuestions.Count,
                        IsMultipleAttempts = examData.IsMultipleAttempts,
                        NoRandomQuestions = examData.NoRandomQuestions,
                        SubjectId = examData.SubjectId,
                        Grade = examData.Grade
                    };
                }
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamRepository", "GetExamById exception. Inner error: " + ex.Message).LogError();
            }
            return null;
        }

        public List<string> GetExamQuestionObjectIds(int examId)
        {
            try
            {
                return _context.ExamQuestions.Where(q => q.ExamId == examId).Select(q => q.QuestionObjectId).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamRepository", "GetExamQuestionObjectIds exception. Inner error: " + ex.Message).LogError();
            }
            return [];
        }

        public Domain.Entities.Exam.Exam? GetLessonExam(int lessonId)
        {
            try
            {
                var examData = _context.Exams.Where(e => e.LessonId == lessonId).FirstOrDefault();
                if (examData != null)
                {
                    return new Domain.Entities.Exam.Exam
                    {
                        Id = examData.Id,
                        Title = examData.Title,
                        Description = examData.Description ?? "",
                        Duration = examData.Duration,
                        OpenTime = examData.OpenTime,
                        CloseTime = examData.CloseTime,
                        LessonId = examData.LessonId.GetValueOrDefault(),
                        ShowAnswers = examData.ShowAnswers.GetValueOrDefault(),
                        ShowCorrectAnswers = examData.ShowCorrectAnswers,
                        IsMultipleAttempts = false
                    };
                }
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamRepository", "GetLessonExam exception. Inner error: " + ex.Message).LogError();
            }
            return null;
        }

        public string GetLessonName(int lessonId)
        {
            try
            {
                return _context.Lessons.First(l => l.Id == lessonId).Name;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamRepository", "GetLessonName exception. Inner error: " + ex.Message).LogError();
            }
            return string.Empty;
        }

        public int GetExamIdByResultId(string resultId)
        {
            try
            {
                var result = _context.ExamResults.Find(resultId);
                return result?.ExamId ?? 0;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamRepository", "GetNumberOfQuestionsByResult exception. Inner error: " + ex.Message).LogError();
            }
            return 0;
        }

        public bool? IsLessonExamExists(int lessonId)
        {
            try
            {
                return _context.Exams.Any(e => e.LessonId == lessonId);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamRepository", "IsLessonExamExists exception. Inner error: " + ex.Message).LogError();
            }
            return null;
        }

        public bool UpdateExam(Domain.Entities.Exam.Exam examEntity)
        {
            var transaction = _context.Database.BeginTransaction();
            try
            {
                var exam = _context.Exams.First(exam => exam.Id == examEntity.Id);
                if (exam == null)
                {
                    throw new Exception($"Exam id = {examEntity.Id} is null");
                }
                exam.Title = examEntity.Title;
                exam.Description = examEntity.Description;
                exam.Duration = examEntity.Duration;
                exam.ShowAnswers = examEntity.ShowAnswers;
                exam.ShowCorrectAnswers = examEntity.ShowCorrectAnswers;
                exam.OpenTime = examEntity.OpenTime;
                exam.CloseTime = examEntity.CloseTime;
                exam.IsMultipleAttempts = examEntity.IsMultipleAttempts;
                exam.NoRandomQuestions = examEntity.NoRandomQuestions;
                exam.SubjectId = examEntity.SubjectId;
                exam.Grade = examEntity.Grade;

                _context.Exams.Update(exam);
                _context.SaveChanges();

                transaction.Commit();
                return true;
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                new InfrastructureException("ExamRepository", "UpdateExam exception. Inner error: " + ex.Message).LogError();
            }
            return false;
        }

        public bool UpdateExamQuestions(int examId, List<string> questionObjectIds)
        {
            var transaction = _context.Database.BeginTransaction();
            try
            {
                var existingQuestions = _context.ExamQuestions.Where(eq => eq.ExamId == examId);
                _context.ExamQuestions.RemoveRange(existingQuestions);
                _context.SaveChanges();
                var newQuestions = questionObjectIds.Select(id => new ExamQuestion
                {
                    ExamId = examId,
                    QuestionObjectId = id
                });
                _context.ExamQuestions.AddRange(newQuestions);
                _context.SaveChanges();
                transaction.Commit();
                return true;
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                new InfrastructureException("ExamRepository", "UpdateExamQuestions exception. Inner error: " + ex.Message).LogError();
            }
            return false;
        }

        public int GetCourseIdByLessonId(int lessonId)
        {
            try
            {
                return _context.Lessons
                    .Where(l => l.Id == lessonId)
                    .Select(l => l.Chapter.CourseId)
                    .FirstOrDefault();
            }
            catch (Exception ex)
            {
                new InfrastructureException("ExamRepository", "GetCourseIdByLessonId exception. Inner error: " + ex.Message).LogError();
            }
            return 0;
        }
    }
}
