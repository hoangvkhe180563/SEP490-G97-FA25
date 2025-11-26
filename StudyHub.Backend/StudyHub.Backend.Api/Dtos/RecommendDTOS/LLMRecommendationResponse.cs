using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.Api.Dtos.RecommendDTOS
{
    // Full Recommendation Response
    public class LLMRecommendationResponse
    {
        public UserPreferenceProfile Profile { get; set; }
        public List<CourseRecommendationResult> CourseRecommendations { get; set; }
        public List<DocumentRecommendationResult> DocumentRecommendations { get; set; }
        public string CourseExplanation { get; set; }
        public string DocumentExplanation { get; set; }
        public int CourseTotalResults { get; set; }
        public int DocumentTotalResults { get; set; }
    }
}
