using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.Infrastructure.Exceptions;
using Microsoft.EntityFrameworkCore;

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
                return _context.Chapters
                    .Include(ch => ch.Lessons)
                        .ThenInclude(l => l.LessonVideo)
                    .Include(ch => ch.Lessons)
                        .ThenInclude(l => l.LessonReading)
                    .Where(ch => ch.CourseId == courseId)
                    .Select(ch => new Chapter
                    {
                        Id = ch.Id,
                        Name = ch.Name,
                        CourseId = ch.CourseId,
                        Description = ch.Description,
                        PostDate = ch.PostDate,
                        Lessons = ch.Lessons.Select(l => new Lesson
                        {
                            Id = l.Id,
                            Name = l.Name,
                            ChapterId = l.ChapterId,
                            Type = l.Type,
                            Description = l.Description,
                            Duration = l.Duration,
                            PostDate = l.PostDate,
                            IsPreview = l.IsPreview,
                            ResourceId = l.ResourceId,
                            LessonVideo = l.LessonVideo == null ? null :
                                new LessonVideo { LessonId = l.LessonVideo.LessonId, Url = l.LessonVideo.Url },
                            LessonReading = l.LessonReading == null ? null :
                                new LessonReading { LessonId = l.LessonReading.LessonId, Content = l.LessonReading.Content }
                        }).ToList()
                    })
                    .ToList();
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
                var ch = _context.Chapters
                    .Include(c => c.Lessons)
                        .ThenInclude(l => l.LessonReading)
                    .Include(c => c.Lessons)
                        .ThenInclude(l => l.LessonVideo)
                    .FirstOrDefault(c => c.Id == id);

                if (ch == null) return null;

                return new Chapter
                {
                    Id = ch.Id,
                    Name = ch.Name,
                    CourseId = ch.CourseId,
                    Description = ch.Description,
                    PostDate = ch.PostDate,
                    Lessons = ch.Lessons.Select(l => new Lesson
                    {
                        Id = l.Id,
                        Name = l.Name,
                        ChapterId = l.ChapterId,
                        Type = l.Type,
                        Description = l.Description,
                        Duration = l.Duration,
                        PostDate = l.PostDate,
                        IsPreview = l.IsPreview,
                        ResourceId = l.ResourceId,
                        LessonVideo = l.LessonVideo == null ? null :
                            new LessonVideo { LessonId = l.LessonVideo.LessonId, Url = l.LessonVideo.Url },
                        LessonReading = l.LessonReading == null ? null :
                            new LessonReading { LessonId = l.LessonReading.LessonId, Content = l.LessonReading.Content }
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
                    Description = chapter.Description,
                    PostDate = chapter.PostDate,
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
                var entity = _context.Chapters
                    .Include(c => c.Lessons)
                    .FirstOrDefault(c => c.Id == chapter.Id);

                if (entity == null) return chapter;

                entity.Name = chapter.Name;
                entity.Description = chapter.Description;
                entity.PostDate = chapter.PostDate;

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
                var entity = _context.Chapters
                    .Include(c => c.Lessons)
                        .ThenInclude(l => l.LessonReading)
                    .Include(c => c.Lessons)
                        .ThenInclude(l => l.LessonVideo)
                    .FirstOrDefault(c => c.Id == id);

                if (entity == null) return false;

                foreach (var lesson in entity.Lessons)
                {
                    if (lesson.LessonReading != null)
                        _context.LessonReadings.Remove(lesson.LessonReading);

                    if (lesson.LessonVideo != null)
                        _context.LessonVideos.Remove(lesson.LessonVideo);
                }

                _context.Lessons.RemoveRange(entity.Lessons);
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
