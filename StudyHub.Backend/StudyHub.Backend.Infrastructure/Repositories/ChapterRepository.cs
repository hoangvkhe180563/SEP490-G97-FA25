using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class ChapterRepository : IChapterRepository
    {
        private readonly Data.AppDbContext _context;
        public ChapterRepository(Data.AppDbContext context)
        {
            _context = context;
        }

        public List<Chapter> GetChaptersByCourseId(int courseId)
        {
            try
            {
                return _context.Chapters.Where(ch => ch.CourseId == courseId).Select(ch => new Chapter
                {
                    Id = ch.Id,
                    Name = ch.Name,
                    CourseId = ch.CourseId,
                    Status = ch.Status,
                    Lessons = ch.Lessons.Select(l => new Lesson
                    {
                        Id = l.Id,
                        Name = l.Name,
                        ChapterId = l.ChapterId,
                        Status = l.Status,
                        Type = l.Type,
                    }).ToList()
                }).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("ChapterRepository", "GetChaptersByCourseId failed. Inner error: " + ex.Message).LogError();
                return new List<Chapter>();
            }
        }

        public Chapter? GetChapterById(int id)
        {
            try
            {
                var ch = _context.Chapters.Include(c => c.Lessons).FirstOrDefault(c => c.Id == id);
                if (ch == null) return null;
                return new Chapter
                {
                    Id = ch.Id,
                    Name = ch.Name,
                    CourseId = ch.CourseId,
                    Status = ch.Status,
                    Lessons = ch.Lessons.Select(l => new Lesson
                    {
                        Id = l.Id,
                        Name = l.Name,
                        ChapterId = l.ChapterId,
                        Status = l.Status,
                        Type = l.Type,
                    }).ToList()
                };
            }
            catch (Exception ex)
            {
                new InfrastructureException("ChapterRepository", "GetChapterById failed. Inner error: " + ex.Message).LogError();
                return null;
            }
        }

        public Chapter CreateChapter(Chapter chapter)
        {
            try
            {
                var entity = new Data.Chapter
                {
                    Name = chapter.Name,
                    CourseId = chapter.CourseId,
                    Status = chapter.Status ?? true
                };
                _context.Chapters.Add(entity);
                _context.SaveChanges();
                chapter.Id = entity.Id;
                return chapter;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ChapterRepository", "CreateChapter failed. Inner error: " + ex.Message).LogError();
                return chapter;
            }
        }

        public Chapter UpdateChapter(Chapter chapter)
        {
            try
            {
                var entity = _context.Chapters.Find(chapter.Id);
                if (entity == null) return chapter;
                entity.Name = chapter.Name;
                entity.Status = chapter.Status;
                _context.SaveChanges();
                return chapter;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ChapterRepository", "UpdateChapter failed. Inner error: " + ex.Message).LogError();
                return chapter;
            }
        }

        public bool DeleteChapter(int id)
        {
            try
            {
                var entity = _context.Chapters.Find(id);
                if (entity == null) return false;
                _context.Chapters.Remove(entity);
                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ChapterRepository", "DeleteChapter failed. Inner error: " + ex.Message).LogError();
                return false;
            }
        }
    }
}
