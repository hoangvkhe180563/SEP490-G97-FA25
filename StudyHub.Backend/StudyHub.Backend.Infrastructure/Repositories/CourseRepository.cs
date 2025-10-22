using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Exceptions;
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
                return _context.Courses.Select(c => new Domain.Entities.Course
                {
                    Id = c.Id,
                    Name = c.Name,
                    Information = c.Information,
                    ImageUrl = c.ImageUrl,
                    Price = c.Price,
                    Grade = c.Grade,
                    SubjectId = c.SubjectId,
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
                return new Domain.Entities.Course
                {
                    Id = c.Id,
                    Name = c.Name,
                    Information = c.Information,
                    ImageUrl = c.ImageUrl,
                    Price = c.Price,
                    Grade = c.Grade,
                    SubjectId = c.SubjectId,
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

        public List<Course> GetCourseBySchool(int schoolId)
        {
            try
            {
                var courses = _context.Courses.Include(c => c.Subject).Where(c => c.SchoolId == schoolId && c.Status == true)
                    .Select(c => new Course
                    {
                        Id = c.Id,
                        Name = c.Name,
                        ImageUrl = c.ImageUrl,
                        Grade = c.Grade,
                        IsFeatured = c.IsFeatured,
                        Subject = c.Subject != null ? new Subject { Id = c.Subject.Id, Name = c.Subject.Name } : null,
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
    }
}
