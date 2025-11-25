using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ElasticAdminController : ControllerBase
    {
        private readonly ElasticVectorSearchService _elasticsearchService;

        public ElasticAdminController(ElasticVectorSearchService elasticsearchService)
        {
            _elasticsearchService = elasticsearchService;
        }

        [HttpPost("setup-index")]
        public async Task<IActionResult> SetupIndex()
        {
            try
            {
                var result = await _elasticsearchService.CreateIndexAsync();
                return Ok(new { success = result, message = "Index created successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("index-course")]
        public async Task<IActionResult> AddCourse([FromBody] UpsertElasticCourseRequest course)
        {
            try
            {
                var result = await _elasticsearchService.IndexCourseAsync(course);
                return Ok(new { success = result, message = "Course added successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("index-all-db")]
        public async Task<IActionResult> IndexAllFromDb()
        {
            try
            {
                var result = await _elasticsearchService.IndexAllCoursesFromDbAsync();
                return Ok(new { success = result, message = result ? "All courses indexed successfully" : "Failed to index courses" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("index/{id}")]
        public async Task<IActionResult> DeleteIndexById(int id)
        {
            try
            {
                var result = await _elasticsearchService.DeleteCourseByIdAsync(id);
                return Ok(new { success = result, message = result ? "Document deleted successfully" : "Failed to delete document" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("seed-courses")]
        public async Task<IActionResult> SeedCourses()
        {
            try
            {
                var courses = GenerateTestCourses();
                var result = await _elasticsearchService.IndexCoursesBatchAsync(courses);

                return Ok(new
                {
                    success = result,
                    message = $"{courses.Count} courses indexed successfully",
                    courses = courses.Select(c => new { c.Id, c.Name, c.Difficulty })
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("seed-llm-courses")]
        public async Task<IActionResult> SeedLLMCourses()
        {
            try
            {
                var result = await _elasticsearchService.SeedSampleCoursesAsync();
                return Ok(new
                {
                    success = result,
                    message = "20 sample courses seeded successfully for LLM testing"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message, stack = ex.StackTrace });
            }
        }
        private List<Course> GenerateTestCourses()
        {
            var courses = new List<Course>();
            var subjects = new[] { "Toán học", "Hóa học", "Ngữ văn", "Vật lý" };
            var difficulties = new[]
            {
            CourseDifficulty.Beginner,
            CourseDifficulty.Intermediate,
            CourseDifficulty.Advanced
        };
            var lengths = new[] { CourseLength.Short, CourseLength.Medium, CourseLength.Long };

            int id = 1;

            foreach (var subject in subjects)
            {
                foreach (var difficulty in difficulties)
                {
                    // 2-3 khóa học cho mỗi môn ở mỗi độ khó
                    for (int i = 0; i < 2; i++)
                    {
                        var grade = difficulty switch
                        {
                            CourseDifficulty.Beginner => 10,
                            CourseDifficulty.Intermediate => 11,
                            CourseDifficulty.Advanced => 12,
                            _ => 10
                        };

                        var difficultyName = difficulty switch
                        {
                            CourseDifficulty.Beginner => "cơ bản",
                            CourseDifficulty.Intermediate => "trung bình",
                            CourseDifficulty.Advanced => "nâng cao",
                            _ => ""
                        };

                        courses.Add(new Course
                        {
                            Id = id++,
                            Name = $"{subject} lớp {grade} {difficultyName} - Phần {i + 1}",
                            Information = $"Khóa học {subject} dành cho học sinh lớp {grade}, " +
                                        $"độ khó {difficultyName}. Giúp học sinh nắm vững kiến thức " +
                                        $"và kỹ năng {subject}.",
                            SchoolId = 1,
                            Subject = new Domain.Entities.Subject { Name = subject },
                            Difficulty = difficulty,
                            Length = lengths[i % 3],
                            Grade = (sbyte)grade
                        });
                    }
                }
            }

            return courses;
        }
    }
}
