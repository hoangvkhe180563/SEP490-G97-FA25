using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class CourseRepository : ICourseRepository
    {
        private readonly Data.AppDbContext _context;

        public CourseRepository(Data.AppDbContext context)
        {
            _context = context;
        }

        public Course? GetCourseById(int id)
        {
            try
            {
                var c = _context.Courses
                    .Include(c => c.Chapters)
                    .FirstOrDefault(x => x.Id == id);

                if (c == null) return null;

                return new Course
                {
                    Id = c.Id,
                    Name = c.Name,
                    Information = c.Information,
                    ImageUrl = c.ImageUrl,
                    Price = c.Price,
                    Grade = c.Grade,
                    SubjectId = c.SubjectId,
                    SchoolId = c.SchoolId,
                    IsFeatured = c.IsFeatured,
                    Status = c.Status,
                    CreatedAt = c.CreatedAt,
                    CreatedBy = c.CreatedBy,
                    UpdatedAt = c.UpdatedAt,
                    UpdatedBy = c.UpdatedBy,
                    StartAt = c.StartAt,
                    EndAt = c.EndAt,
                    Chapters = c.Chapters.Select(ch => new Domain.Entities.Chapter
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
                            LessonReading = l.LessonReading == null ? null : new LessonReading
                            {
                                Content = l.LessonReading.Content
                            },
                            LessonVideo = l.LessonVideo == null ? null : new LessonVideo
                            {
                                Url = l.LessonVideo.Url
                            },
                            Duration = l.Duration,
                            Description = l.Description,
                            PostDate = l.PostDate,
                            IsPreview = l.IsPreview,
                            ResourceId = l.ResourceId,
                        }).ToList()
                    }).ToList()

                };
            }
            catch (Exception ex)
            {
                new InfrastructureException("CourseRepository", "GetCourseById failed. Inner error: " + ex.Message).LogError();
                return null;
            }
        }

        public Course CreateCourse(Course course)
        {
            try
            {
                var entity = new Data.Course
                {
                    Name = course.Name,
                    Information = course.Information,
                    ImageUrl = course.ImageUrl,
                    Price = course.Price,
                    Grade = course.Grade,
                    SubjectId = course.SubjectId,
                    SchoolId = course.SchoolId,
                    IsFeatured = course.IsFeatured,
                    Status = course.Status,
                    CreatedAt = DateTime.UtcNow,
                    StartAt = course.StartAt,
                    EndAt = course.EndAt,
                    CreatedBy = course.CreatedBy,
                };

                _context.Courses.Add(entity);
                _context.SaveChanges();

                course.Id = entity.Id;
                return course;
            }
            catch (Exception ex)
            {
                new InfrastructureException("CourseRepository", "CreateCourse failed. Inner error: " + ex.Message).LogError();
                return new Course();
            }
        }

        public Course UpdateCourse(Course course)
        {
            try
            {
                var entity = _context.Courses.Find(course.Id);
                if (entity == null) return course;

                entity.Name = course.Name;
                entity.Information = course.Information;
                entity.ImageUrl = course.ImageUrl;
                entity.Price = course.Price;
                entity.Grade = course.Grade;
                entity.SubjectId = course.SubjectId;
                entity.SchoolId = course.SchoolId;
                entity.IsFeatured = course.IsFeatured;
                entity.Status = course.Status;
                entity.StartAt = course.StartAt;
                entity.EndAt = course.EndAt;
                entity.UpdatedAt = DateTime.UtcNow;
                entity.UpdatedBy = course.UpdatedBy;

                _context.SaveChanges();
                return course;
            }
            catch (Exception ex)
            {
                new InfrastructureException("CourseRepository", "UpdateCourse failed. Inner error: " + ex.Message).LogError();
                return new Course();
            }
        }

        public bool DeleteCourse(int id)
        {
            try
            {
                var entity = _context.Courses
                    .Include(c => c.Chapters)
                    .ThenInclude(ch => ch.Lessons)
                    .FirstOrDefault(c => c.Id == id);

                if (entity == null) return false;

                foreach (var chapter in entity.Chapters)
                {
                    _context.Lessons.RemoveRange(chapter.Lessons);
                }

                _context.Chapters.RemoveRange(entity.Chapters);
                _context.Courses.Remove(entity);
                _context.SaveChanges();

                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("CourseRepository", "DeleteCourse failed. Inner error: " + ex.Message).LogError();
                return false;
            }
        }

        public List<Course> GetCourseBySchool(int schoolId)
        {
            try
            {
                var courses = _context.Courses.Include(c => c.Subject).Where(c => c.SchoolId == schoolId && c.Status.Equals("Mở"))
                    .Select(c => new Course
                    {
                        Id = c.Id,
                        Name = c.Name,
                        ImageUrl = c.ImageUrl,
                        Grade = c.Grade,
                        IsFeatured = c.IsFeatured,
                        Subject = new Subject { Id = c.Subject.Id, Name = c.Subject.Name }
                    })
                    .ToList();
                return courses;
            }
            catch (Exception ex)
            {
                new InfrastructureException("CourseRepository", "GetCourseBySchool failed. Inner error: " + ex.Message).LogError();
            }
            return [];
        }

        public PagedResult<Course> GetAllCourses(CourseQueryParams query)
        {
            try
            {
                var q = _context.Courses.AsQueryable();

                if (!string.IsNullOrWhiteSpace(query.Q))
                {
                    var t = query.Q.Trim().ToLower();
                    q = q.Where(c => c.Name.ToLower().Contains(t)
                        || (c.Information != null && c.Information.ToLower().Contains(t)));
                }

                if (query.SubjectId.HasValue)
                {
                    q = q.Where(c => c.SubjectId == query.SubjectId.Value);
                }

                if (query.Grade.HasValue)
                {
                    q = q.Where(c => c.Grade == query.Grade.Value);
                }

                if (query.Instructor != null)
                {
                    var t = query.Instructor;
                    q = q.Where(c => c.CreatedBy == t);
                }

                //if (!string.IsNullOrWhiteSpace(query.Duration))
                //{
                //    q = q.Where(c => c.Duration == query.Duration);
                //}

                if (string.IsNullOrEmpty(query.Status))
                    q = q.Where(c => c.Status.Equals(query.Status));

                if (query.IsFeatured.HasValue)
                    q = q.Where(c => c.IsFeatured == query.IsFeatured.Value);

                switch ((query.Sort ?? string.Empty).ToLower())
                {
                    case "priceasc":
                        q = q.OrderBy(c => c.Price);
                        break;
                    case "pricedesc":
                        q = q.OrderByDescending(c => c.Price);
                        break;
                    case "newest":
                        q = q.OrderByDescending(c => c.CreatedAt);
                        break;
                    default:
                        q = q.OrderByDescending(c => c.CreatedAt);
                        break;
                }

                var total = q.Count();
                var page = Math.Max(1, query.Page);
                var pageSize = Math.Max(1, query.PageSize);
                var totalPages = (int)Math.Ceiling((double)total / pageSize);

                var items = q.Skip((page - 1) * pageSize)
                    .Take(pageSize)
                   .Select(c => new Course
                   {
                       Id = c.Id,
                       Name = c.Name,
                       Information = c.Information,
                       ImageUrl = c.ImageUrl,
                       Price = c.Price,
                       Grade = c.Grade,
                       SubjectId = c.SubjectId,
                       SchoolId = c.SchoolId,
                       IsFeatured = c.IsFeatured,
                       Status = c.Status,
                       CreatedAt = c.CreatedAt,
                       CreatedBy = c.CreatedBy,
                       UpdatedAt = c.UpdatedAt,
                       UpdatedBy = c.UpdatedBy,
                       StartAt = c.StartAt,
                       EndAt = c.EndAt,
                       Chapters = c.Chapters.Select(ch => new Domain.Entities.Chapter
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
                               LessonReading = l.LessonReading == null ? null : new LessonReading
                               {
                                   Content = l.LessonReading.Content
                               },
                               LessonVideo = l.LessonVideo == null ? null : new LessonVideo
                               {
                                   Url = l.LessonVideo.Url
                               },
                               Duration = l.Duration,
                               Description = l.Description,
                               PostDate = l.PostDate,
                               IsPreview = l.IsPreview,
                               ResourceId = l.ResourceId,
                           }).ToList()
                       }).ToList()

                   }).ToList();

                return new PagedResult<Course>
                {
                    Items = items,
                    Total = total,
                    Page = page,
                    Limit = pageSize,
                    TotalPages = totalPages
                };
            }
            catch (Exception ex)
            {
                new InfrastructureException("CourseRepository", "GetAllCourses failed. Inner error: " + ex.Message).LogError();
                return new PagedResult<Course>();
            }
        }

       
    }
}
