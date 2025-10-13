using StudyHub.Backend.Domain.Entities;
using Data = StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.Infrastructure.Exceptions;
using System.Linq;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class LessonRepository : ILessonRepository
    {
        private readonly Data.AppDbContext _context;
        public LessonRepository(Data.AppDbContext context)
        {
            _context = context;
        }

        public List<Lesson> GetLessonsByChapterId(int chapterId)
        {
            try
            {
                return _context.Lessons.Where(l => l.ChapterId == chapterId).Select(l => new Lesson
                {
                    Id = l.Id,
                    Name = l.Name,
                    IsPreview = l.IsPreview,
                    ChapterId = l.ChapterId,
                    Status = l.Status,
                    Type = l.Type,
                    Content = l.Content
                }).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("LessonRepository", "GetLessonsByChapterId failed. Inner error: " + ex.Message).LogError();
                return new List<Lesson>();
            }
        }

        public Lesson? GetLessonById(int id)
        {
            try
            {
                var l = _context.Lessons.Find(id);
                if (l == null) return null;
                return new Lesson
                {
                    Id = l.Id,
                    Name = l.Name,
                    IsPreview = l.IsPreview,
                    ChapterId = l.ChapterId,
                    Status = l.Status,
                    Type = l.Type,
                    Content = l.Content
                };
            }
            catch (Exception ex)
            {
                new InfrastructureException("LessonRepository", "GetLessonById failed. Inner error: " + ex.Message).LogError();
                return null;
            }
        }

        public Lesson CreateLesson(Lesson lesson)
        {
            try
            {
                var entity = new Data.Lesson
                {
                    Name = lesson.Name,
                    IsPreview = lesson.IsPreview,
                    ChapterId = lesson.ChapterId,
                    Status = lesson.Status ?? true,
                    Type = lesson.Type,
                    Content = lesson.Content
                };
                _context.Lessons.Add(entity);
                _context.SaveChanges();
                lesson.Id = entity.Id;
                return lesson;
            }
            catch (Exception ex)
            {
                new InfrastructureException("LessonRepository", "CreateLesson failed. Inner error: " + ex.Message).LogError();
                return lesson;
            }
        }

        public Lesson UpdateLesson(Lesson lesson)
        {
            try
            {
                var entity = _context.Lessons.Find(lesson.Id);
                if (entity == null) return lesson;
                entity.Name = lesson.Name;
                entity.IsPreview = lesson.IsPreview;
                entity.Status = lesson.Status;
                entity.Type = lesson.Type;
                entity.Content = lesson.Content;
                _context.SaveChanges();
                return lesson;
            }
            catch (Exception ex)
            {
                new InfrastructureException("LessonRepository", "UpdateLesson failed. Inner error: " + ex.Message).LogError();
                return lesson;
            }
        }

        public bool DeleteLesson(int id)
        {
            try
            {
                var entity = _context.Lessons.Find(id);
                if (entity == null) return false;
                _context.Lessons.Remove(entity);
                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("LessonRepository", "DeleteLesson failed. Inner error: " + ex.Message).LogError();
                return false;
            }
        }
    }
}
