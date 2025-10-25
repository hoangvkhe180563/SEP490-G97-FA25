using StudyHub.Backend.Domain.Entities;
using Data = StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.Infrastructure.Exceptions;
using Microsoft.EntityFrameworkCore;

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
                return _context.Lessons
                    .Include(l => l.LessonVideo)
                    .Include(l => l.LessonReading)
                    .Where(l => l.ChapterId == chapterId)
                    .Select(l => new Lesson
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
                var l = _context.Lessons
                    .Include(x => x.LessonReading)
                    .Include(x => x.LessonVideo)
                    .FirstOrDefault(x => x.Id == id);

                if (l == null) return null;

                return new Lesson
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
                    LessonReading = l.LessonReading == null ? null :
                        new LessonReading { LessonId = l.LessonReading.LessonId, Content = l.LessonReading.Content },
                    LessonVideo = l.LessonVideo == null ? null :
                        new LessonVideo { LessonId = l.LessonVideo.LessonId, Url = l.LessonVideo.Url }
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
                    ChapterId = lesson.ChapterId,
                    Type = lesson.Type,
                    Description = lesson.Description,
                    Duration = lesson.Duration,
                    PostDate = lesson.PostDate,
                    IsPreview = lesson.IsPreview,
                    ResourceId = lesson.ResourceId
                };

                if (!string.IsNullOrEmpty(lesson.LessonVideo?.Url))
                {
                    entity.LessonVideo = new Data.LessonVideo
                    {
                        Url = lesson.LessonVideo.Url
                    };
                    _context.LessonVideos.Add(entity.LessonVideo);
                }

                if (!string.IsNullOrEmpty(lesson.LessonReading?.Content))
                {
                    entity.LessonReading = new Data.LessonReading
                    {
                        Content = lesson.LessonReading.Content
                    };
                    _context.LessonReadings.Add(entity.LessonReading);
                }


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
                var entity = _context.Lessons
                    .Include(l => l.LessonReading)
                    .Include(l => l.LessonVideo)
                    .FirstOrDefault(l => l.Id == lesson.Id);

                if (entity == null) return lesson;

                entity.Name = lesson.Name;
                entity.Type = lesson.Type;
                entity.Description = lesson.Description;
                entity.Duration = lesson.Duration;
                entity.PostDate = lesson.PostDate;
                entity.IsPreview = lesson.IsPreview;
                entity.ResourceId = lesson.ResourceId;

                // update video
                if (!string.IsNullOrEmpty(lesson.LessonVideo?.Url))
                {
                    if (entity.LessonVideo == null)
                        entity.LessonVideo = new Data.LessonVideo();

                    entity.LessonVideo.Url = lesson.LessonVideo.Url;
                }

                // update reading
                if (!string.IsNullOrEmpty(lesson.LessonReading?.Content))
                {
                    if (entity.LessonReading == null)
                        entity.LessonReading = new Data.LessonReading();

                    entity.LessonReading.Content = lesson.LessonReading.Content;
                }

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
                var entity = _context.Lessons
                    .Include(l => l.LessonReading)
                    .Include(l => l.LessonVideo)
                    .FirstOrDefault(l => l.Id == id);

                if (entity == null) return false;

                if (entity.LessonReading != null)
                    _context.LessonReadings.Remove(entity.LessonReading);

                if (entity.LessonVideo != null)
                    _context.LessonVideos.Remove(entity.LessonVideo);

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
