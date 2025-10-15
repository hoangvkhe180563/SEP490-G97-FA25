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

        public List<Course> GetAllCourses()
        {
            try
            {
                return _context.Courses.Select(c => new Course
                {
                    Id = c.Id,
                    Name = c.Name,
                    Information = c.Information,
                    ImageUrl = c.ImageUrl,
                    Price = c.Price,
                    Grade = c.Grade,
                    SubjectId = c.SubjectId,
                    SchoolId = c.SchoolId,
                    Status = c.Status,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                }).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("CourseRepository", "GetAllCourses failed. Inner error: " + ex.Message).LogError();
                return new List<Course>();
            }

        }

        public Course? GetCourseById(int id)
        {
            try
            {
                var c = _context.Courses.Find(id);
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
                    Status = c.Status,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                };
            }
            catch (Exception ex)
            {
                new InfrastructureException("CourseRepository", "GetCourseById failed. Inner error: " + ex.Message).LogError();
                return new Course { };
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
                    Status = course.Status ?? true,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = course.CreatedBy
                };
                _context.Courses.Add(entity);
                _context.SaveChanges();
                course.Id = entity.Id;
                return course;
            }
            catch (Exception ex)
            {
                new InfrastructureException("CourseRepository", "CreateCourse failed. Inner error: " + ex.Message).LogError();
                return new Course { };
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
                entity.Status = course.Status;
                entity.UpdatedAt = DateTime.UtcNow;
                entity.UpdatedBy = course.UpdatedBy;
                _context.SaveChanges();
                return course;
            }
            catch (Exception ex)
            {
                new InfrastructureException("CourseRepository", "UpdateCourse failed. Inner error: " + ex.Message).LogError();
                return new Course { };
            }

        }

        public bool DeleteCourse(int id)
        {
            try
            {
                var entity = _context.Courses.Find(id);
                if (entity == null) return false;
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

        public PagedResult<Course> SearchCourses(CourseQueryParams query)
        {
            try
            {
                var q = _context.Courses.AsQueryable();

                if (!string.IsNullOrWhiteSpace(query.Q))
                {
                    var t = query.Q.Trim().ToLower();
                    q = q.Where(c => c.Name.ToLower().Contains(t) || (c.Information != null && c.Information.ToLower().Contains(t)));
                }

                if (query.SubjectId.HasValue)
                    q = q.Where(c => c.SubjectId == query.SubjectId.Value);

                if (query.Grade.HasValue)
                    q = q.Where(c => c.Grade == query.Grade.Value);

                if (query.Status.HasValue)
                    q = q.Where(c => c.Status == query.Status.Value);

                if (query.IsFeatured.HasValue)
                    q = q.Where(c => c.IsFeatured == query.IsFeatured.Value);

                // sort
                q = query.SortBy switch
                {
                    "newest" => q.OrderByDescending(c => c.CreatedAt),
                    "price_asc" => q.OrderBy(c => c.Price),
                    "price_desc" => q.OrderByDescending(c => c.Price),
                    _ => q.OrderByDescending(c => c.Id)
                };

                var total = q.Count();
                var page = Math.Max(1, query.Page);
                var pageSize = Math.Max(1, query.PageSize);

                // Tính toán TotalPages
                var totalPages = (int)Math.Ceiling((double)total / pageSize);
                // -----------------------------------------

                var items = q.Skip((page - 1) * pageSize).Take(pageSize)
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
                        Status = c.Status,
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt,
                        IsFeatured = c.IsFeatured
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
                new InfrastructureException("CourseRepository", "SearchCourses failed. Inner error: " + ex.Message).LogError();
                return new PagedResult<Course>();
            }
        }
    }
}
