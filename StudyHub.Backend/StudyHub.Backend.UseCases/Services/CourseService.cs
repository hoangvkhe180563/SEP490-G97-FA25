using System.Threading.Tasks;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class CourseService
    {
        private readonly ICourseRepository _repo;
        private readonly ElasticCourseVectorSearchService _elasticCourseVectorSearchService;
        private readonly IElasticSearchCourse _elasticSearchCourse;

        public CourseService(ICourseRepository repo, ElasticCourseVectorSearchService elasticCourseVectorSearchService, IElasticSearchCourse elasticSearchCourse)
        {
            _repo = repo;
            _elasticCourseVectorSearchService = elasticCourseVectorSearchService;
            _elasticSearchCourse = elasticSearchCourse;
        }

        public PagedResult<Course> GetAllCourses(CourseQueryParams query)
        {
            return _repo.GetAllCourses(query);
        }

        public Course? GetCourse(int id)
        {
            return _repo.GetCourseById(id);
        }

        public async Task<Course> CreateCourse(Course course)
        {
            var created = _repo.CreateCourse(course);
            //var elasticCourse = new UpsertElasticCourseRequest
            //{
            //    Id = created.Id,
            //    Name = created.Name,
            //    ImageUrl = created.ImageUrl ?? string.Empty,
            //    Price = created.Price,
            //    StartAt = created.StartAt,
            //    EndAt = created.EndAt,
            //    CreatedAt = created.CreatedAt,
            //    UpdatedAt = created.UpdatedAt,
            //    CreatedById = created.CreatedBy,
            //    Information = created.Information,
            //    Status = created.Status,
            //    SchoolId = created.SchoolId,
            //    Subject = created.Subject,
            //    Difficulty = created.Difficulty,
            //    Length = created.Length,
            //    Grade = created.Grade,
            //};
            //var isValid = await _elasticCourseVectorSearchService.IndexCourseAsync(elasticCourse);
            //if (!isValid)
            //{
            //    throw new Exception("Failed to update course in ElasticSearch.");
            //}
            return created;
        }

        public async Task<Course> UpdateCourse(Course course)
        {
            var oldCourse = _repo.GetCourseById(course.Id);
            var updated = _repo.UpdateCourse(course);

            if (oldCourse == null)
            {
                throw new Exception("Course not found.");
            }

            if (oldCourse.Status != course.Status)
            {
                await _elasticSearchCourse.UpdateCourseStatusAsync(course.Id, course.Status);
            }
            else
            {
                var elasticCourse = new UpsertElasticCourseRequest
                {
                    Id = updated.Id,
                    Name = updated.Name,
                    ImageUrl = updated.ImageUrl ?? string.Empty,
                    Price = updated.Price,
                    StartAt = updated.StartAt,
                    EndAt = updated.EndAt,
                    CreatedAt = updated.CreatedAt,
                    UpdatedAt = updated.UpdatedAt,
                    CreatedById = updated.CreatedBy,
                    Information = updated.Information,
                    Status = updated.Status,
                    SchoolId = updated.SchoolId,
                    Subject = updated.Subject,
                    Difficulty = updated.Difficulty,
                    Length = updated.Length,
                    Grade = updated.Grade,
                };
                var isValid = await _elasticCourseVectorSearchService.IndexCourseAsync(elasticCourse);
                if (!isValid)
                {
                    throw new Exception("Failed to update course in ElasticSearch.");
                }
            }
            return updated;
        }

        public async Task<bool> DeleteCourse(int id)
        {
            //var isValid = await _elasticSearchCourse.DeleteCourseByIdAsync(id);
            //if (!isValid)
            //{
            //    throw new Exception("Failed to delete course in ElasticSearch.");
            //}
            return _repo.DeleteCourse(id);
        }

        public List<Course> GetCourseBySchool(int schoolId)
        {
            return _repo.GetCourseBySchool(schoolId);
        }
    }
}
