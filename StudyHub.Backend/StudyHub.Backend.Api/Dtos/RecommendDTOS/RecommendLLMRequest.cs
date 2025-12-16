using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.Api.Dtos.RecommendDTOS
{
    public class RecommendLLMRequest
    {
        public string UserMessage { get; set; }
        public UserPreferenceProfile? Profile { get; set; }
        //public List<ChatMessage> ConversationHistory { get; set; } = new();
        public int? TopK { get; set; }

        public bool isGenerateExplanation { get; set; } = false;
    }
}
