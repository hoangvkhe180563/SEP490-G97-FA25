using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.RecommendDTOS;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Services;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecommendationController : ControllerBase
    {
        private readonly ElasticCourseVectorSearchService _elasticCourseVectorSearchService;
        private readonly ElasticDocumentVectorSearchService _elasticDocumentVectorSearchService;
        private readonly ElasticQuestionVectorSearchService _elasticQuestionVectorSearchService;
        private readonly LLMService _llmService;
        private readonly EmbeddingService _embeddingService;
        private readonly AuthService _authService;
        private readonly SubjectService _subjectService;
        private readonly ProfileService _profileService;

        public RecommendationController(ElasticCourseVectorSearchService elasticCourseVectorSearchService, ElasticDocumentVectorSearchService elasticDocumentVectorSearchService, ElasticQuestionVectorSearchService elasticQuestionVectorSearchService, LLMService llmService, EmbeddingService embeddingService, AuthService authService, SubjectService subjectService, ProfileService profileService)
        {
            _elasticCourseVectorSearchService = elasticCourseVectorSearchService;
            _elasticDocumentVectorSearchService = elasticDocumentVectorSearchService;
            _elasticQuestionVectorSearchService = elasticQuestionVectorSearchService;
            _llmService = llmService;
            _embeddingService = embeddingService;
            _authService = authService;
            _subjectService = subjectService;
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

                var profile = _profileService.GetUserLearningProfile();

                return Ok(new { profile = profile, topK = 30 });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("recommend")]
        public async Task<IActionResult> Recommend()
        {
            var request = new RecommendationRequest
            {
                //Profile = new UserLearningProfile
                //{
                //    UserId = "user123",
                //    SchoolId = 1,
                //    CurrentGrades = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 },
                //    CurrentSubjectStudied = new List<string> { "Toán học", "Hoá học", "Ngữ văn", "Vật lý" },
                //    SubjectStrength = new Dictionary<string, float>
                //    {
                //        { "Toán học", 0.9f },
                //        { "Hoá học", 0.5f },
                //        { "Ngữ văn", 0.3f },
                //        { "Vật lý", 0.9f },
                //    },
                //    SubjectAccuracy = new Dictionary<string, float>
                //    {
                //        { "Toán học", 0.3f },
                //        { "Vật lý", 0.9f },
                //    },
                //    WorkSpeed = new Dictionary<string, float>
                //    {
                //        { "Toán học", 0.8f },
                //        { "Hoá học", 0.4f },
                //        { "Ngữ văn", 0.6f },
                //        { "Vật lý", 0.9f },
                //    },
                //    CourseWatchPercentage = new Dictionary<string, float>
                //    {
                //        { "Toán học", 0.95f },
                //        { "Vật lý", 0.4f },
                //    },
                //},
                Profile = _profileService.GetUserLearningProfile(),
                TopK = 30
            };
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
                    courses = courseRecommendations,
                    documents = documentRecommendations,
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
                int totalPromptTokens = 0;
                int totalResponseTokens = 0;

                var profile = new UserPreferenceProfile();
                if (request.UserMessage != null)
                {
                    (profile, totalPromptTokens, totalResponseTokens) = await _llmService.ExtractProfileAsync(request.UserMessage);
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
                var courseExplaination = string.Empty;
                var documentExplaination = string.Empty;
                if (request.isGenerateExplanation)
                {
                    // Step 5: Generate explanation cho top 5
                    if (courseRecommendations.Count > 0)
                    {
                        var (content, promptTokens, completionTokens) = await _llmService.GenerateCourseExplanationWithUsageAsync(
                            profile,
                            courseRecommendations.Take(5).ToList());
                        courseExplaination = content;
                        totalPromptTokens += promptTokens;
                        totalResponseTokens += completionTokens;
                    }
                    // Step 6: Generate explanation cho top 5 document 
                    if (documentRecomendations.Count > 0)
                    {
                        var (content, promptTokens, completionTokens) = await _llmService.GenerateDocumentExplanationWithUsageAsync(
                            profile,
                            documentRecomendations.Take(5).ToList());
                        documentExplaination = content;
                        totalPromptTokens += promptTokens;
                        totalResponseTokens += completionTokens;
                    }
                }
                return Ok(new LLMRecommendationResponse
                {
                    Profile = profile,
                    CourseRecommendations = courseRecommendations,
                    DocumentRecommendations = documentRecomendations,
                    CourseExplanation = courseExplaination,
                    DocumentExplanation = documentExplaination,
                    CourseTotalResults = courseRecommendations.Count,
                    DocumentTotalResults = documentRecomendations.Count,
                    TotalPromptTokens = totalPromptTokens,
                    TotalResponseTokens = totalResponseTokens
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message, stack = ex.StackTrace });
            }
        }

        [HttpPost("generate-quiz")]
        public async Task<IActionResult> GenerateQuiz([FromBody] CreateQuizRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.UserMessage))
                    return BadRequest(new { error = "UserMessage is required" });

                var (spec, promptTokens, completionTokens) = await _llmService.ExtractQuizSpecAsync(request.UserMessage);

                // Override subject and grade from request if provided.
                if (request.SubjectId.HasValue)
                {
                    try
                    {
                        var subjects = _subjectService.GetSubjects();
                        var match = subjects.FirstOrDefault(s => s.Id == request.SubjectId.Value);
                        if (match != null && !string.IsNullOrWhiteSpace(match.Name))
                        {
                            spec.Subject = new List<string> { match.Name! };
                        }
                    }
                    catch
                    {
                        return BadRequest(new { error = "Mã môn không hợp lệ" });
                    }
                }

                if (request.Grade.HasValue)
                {
                    spec.Grade = request.Grade.Value;
                }

                if (spec.NumQuestions > 10)
                    return BadRequest(new { error = "Số lượng câu hỏi được tạo tối đa là 10" });

                //var keywords = (spec.Keywords != null && spec.Keywords.Count > 0) ? spec.Keywords : new List<string> { request.UserMessage };

                //int? grade = spec.Grade;
                //int? subjectId = null;
                //if (!string.IsNullOrWhiteSpace(spec.Subject))
                //{
                //    var subjects = _subjectService.GetSubjects();
                //    var match = subjects.FirstOrDefault(s => !string.IsNullOrWhiteSpace(s.Name) && s.Name.Contains(spec.Subject, System.StringComparison.OrdinalIgnoreCase));
                //    if (match != null) subjectId = match.Id;
                //}

                //var examples = await _elasticQuestionVectorSearchService.SearchSimilarQuestionsAsync(keywords, 5, subjectId, grade);


                var specDto = StudyHub.Backend.UseCases.Dtos.QuizSpecDto.From(spec);
                var (questions, generated, genPromptTokens, genCompletionTokens) = await _llmService.GenerateQuizAsync(specDto);

                var resp = new CreateQuizResponse
                {
                    Spec = spec,
                    //Examples = examples,
                    GeneratedQuestions = questions
                };

                return Ok(resp);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
