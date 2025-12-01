using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.Api.Dtos.RecommendDTOS
{
    public class RecommendationRequest
    {
        public UserLearningProfile Profile { get; set; }
        public int? TopK { get; set; }
    }
}
