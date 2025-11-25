using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.RecommendDTOS;
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
                var courseRecommendations = await _elasticsearchService.SearchWithLLMProfileAsync(
                    profile,
                    request.TopK ?? 30);

                // Step 3: Generate explanation cho top 5
                var explanation = await _llmService.GenerateExplanationAsync(
                    profile,
                    courseRecommendations.Take(5).ToList());

                return Ok(new LLMRecommendationResponse
                {
                    Profile = profile,
                    CourseRecommendations = courseRecommendations,
                    Explanation = explanation,
                    TotalResults = courseRecommendations.Count
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message, stack = ex.StackTrace });
            }
        }
    }
}
