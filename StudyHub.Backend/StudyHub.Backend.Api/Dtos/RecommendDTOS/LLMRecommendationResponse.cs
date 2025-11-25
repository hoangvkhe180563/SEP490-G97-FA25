using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.Api.Dtos.RecommendDTOS
{
    // Full Recommendation Response
    public class LLMRecommendationResponse
    {
        public UserPreferenceProfile Profile { get; set; }
        public List<CourseRecommendationResult> CourseRecommendations { get; set; }
        public string Explanation { get; set; }
        public int TotalResults { get; set; }
    }
}
