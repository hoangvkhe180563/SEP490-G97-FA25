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
        private readonly ElasticCourseVectorSearchService _elasticCourseVectorSearchService;
        private readonly ElasticDocumentVectorSearchService _elasticDocumentVectorSearchService;
        private readonly QwenLLMService _llmService;
        private readonly EmbeddingService _embeddingService;
        private readonly AuthService _authService;
        private readonly IProfileService _profileService;

        public RecommendationController(ElasticCourseVectorSearchService elasticCourseVectorSearchService, ElasticDocumentVectorSearchService elasticDocumentVectorSearchService, QwenLLMService llmService, EmbeddingService embeddingService, AuthService authService, IProfileService profileService)
        {
            _elasticCourseVectorSearchService = elasticCourseVectorSearchService;
            _elasticDocumentVectorSearchService = elasticDocumentVectorSearchService;
            _llmService = llmService;
            _embeddingService = embeddingService;
            _authService = authService;
            _profileService = profileService;
        }



        // API để lấy khuyến nghị khóa học
        // API để lấy profile học tập của user hiện tại
        [HttpGet("profile-current")]
        public IActionResult GetCurrentUserLearningProfile()
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null) return Unauthorized();

                var profile = _profileService.GetUserLearningProfile(currentUser.Id);

                return Ok(new { profile = profile, topK = 30 });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("recommend")]
        public async Task<IActionResult> Recommend([FromBody] RecommendationRequest request)
        {
            try
            {
                var courseRecommendations = await _elasticCourseVectorSearchService.RecommendCoursesAsync(
                    request.Profile,
                    request.TopK ?? 30
                );

                var documentRecommendations = await _elasticDocumentVectorSearchService.RecommendDocumentsAsync(
                    request.Profile,
                    request.TopK ?? 30
                );

                return Ok(new
                {
                    userId = request.Profile.UserId,
                    totalCourseRecommendations = courseRecommendations.Count,
                    totalDocumentRecommendations = documentRecommendations.Count,
                    courses = courseRecommendations.Select(c => new
                    {
                        c.Id,
                        c.Name,
                        c.SubjectName,
                        c.Difficulty,
                        c.Length,
                        c.Grade,
                        c.Information
                    }),
                    documents = documentRecommendations.Select(d => new
                    {
                        d.Id,
                        d.Name,
                        d.SubjectName,
                        d.DocumentLevel,
                        d.DocumentLengthType,
                        d.Grade,
                        d.Description
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

                // Step 2: Tạo query text từ goal + topic (để embed)
                var queryText = _embeddingService.BuildQueryTextForEmbedding(profile);

                // Step 3: Tạo dense vector
                var denseVector = await _embeddingService.GetEmbeddingAsync(queryText);

                // Step 4: Search với profile (goal + topic → vector, topicKeywords → BM25)
                var courseRecommendations = await _elasticCourseVectorSearchService.SearchCourseWithLLMProfileAsync(
                    denseVector,
                    profile,
                    request.TopK ?? 30);

                var documentRecomendations = await _elasticDocumentVectorSearchService.SearchDocumentWithLLMProfileAsync(
                    denseVector,
                    profile,
                    request.TopK ?? 30);

                // Step 5: Generate explanation cho top 5
                var courseExplaination = await _llmService.GenerateCourseExplanationAsync(
                    profile,
                    courseRecommendations.Take(5).ToList());

                // Step 6: Generate explanation cho top 5 document 
                var documentExplaination = await _llmService.GenerateDocumentExplanationAsync(
                    profile,
                    documentRecomendations.Take(5).ToList());

                return Ok(new LLMRecommendationResponse
                {
                    Profile = profile,
                    CourseRecommendations = courseRecommendations,
                    DocumentRecommendations = documentRecomendations,
                    CourseExplanation = courseExplaination,
                    DocumentExplanation = documentExplaination,
                    CourseTotalResults = courseRecommendations.Count,
                    DocumentTotalResults = documentRecomendations.Count
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message, stack = ex.StackTrace });
            }
        }
    }
}
