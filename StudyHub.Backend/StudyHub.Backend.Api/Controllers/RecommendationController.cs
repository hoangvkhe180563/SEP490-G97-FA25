using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecommendationController : ControllerBase
    {
        private readonly ElasticVectorSearchService _elasticsearchService;
        private readonly QwenLLMService _llmService;

        public RecommendationController(ElasticVectorSearchService elasticsearchService, QwenLLMService llmService)
        {
            _elasticsearchService = elasticsearchService;
            _llmService = llmService;
        }

        // API để tạo index
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

        // API để thêm 30 khóa học test
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

        // API để thêm một khóa học
        [HttpPost("add-course")]
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

        // API để lấy khuyến nghị khóa học
        [HttpPost("recommend")]
        public async Task<IActionResult> RecommendCourses([FromBody] RecommendationRequest request)
        {
            try
            {
                var recommendations = await _elasticsearchService.RecommendCoursesAsync(
                    request.Profile,
                    request.TopK ?? 30
                );

                return Ok(new
                {
                    userId = request.Profile.UserId,
                    totalRecommendations = recommendations.Count,
                    courses = recommendations.Select(c => new
                    {
                        c.Id,
                        c.Name,
                        c.SubjectName,
                        c.Difficulty,
                        c.Length,
                        c.Grade,
                        c.Information
                    })
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
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

        // ============================================
        // 1. SETUP APIs
        // ============================================

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

        [HttpPost("recommend-llm")]
        public async Task<IActionResult> RecommendLLM([FromBody] RecommendLLMRequest request)
        {
            try
            {

                // Step 1: Extract profile từ user message
                var profile = new UserPreferenceProfile();
                if (request.UserMessage != null)
                {
                    profile = await _llmService.ExtractProfileAsync(request.UserMessage);
                }
                else if (request.Profile != null)
                {
                    profile = request.Profile;
                }
                // Step 2: Search với profile (goal + topic → vector, topicKeywords → BM25)
                var recommendations = await _elasticsearchService.SearchWithLLMProfileAsync(
                    profile,
                    request.TopK ?? 30);

                // Step 3: Generate explanation cho top 5
                var explanation = await _llmService.GenerateExplanationAsync(
                    profile,
                    recommendations.Take(5).ToList());

                return Ok(new LLMRecommendationResponse
                {
                    Profile = profile,
                    Recommendations = recommendations,
                    Explanation = explanation,
                    TotalResults = recommendations.Count
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message, stack = ex.StackTrace });
            }
        }
    }
    public class RecommendationRequest
    {
        public UserLearningProfile Profile { get; set; }
        public int? TopK { get; set; }
    }
    public class RecommendLLMRequest
    {
        public string UserMessage { get; set; }
        public UserPreferenceProfile Profile { get; set; }
        //public List<ChatMessage> ConversationHistory { get; set; } = new();
        public int? TopK { get; set; }
    }
}
