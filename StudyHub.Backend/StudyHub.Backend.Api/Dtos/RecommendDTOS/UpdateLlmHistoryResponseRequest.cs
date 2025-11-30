namespace StudyHub.Backend.Api.Dtos.RecommendDTOS
{
    public class UpdateLlmHistoryResponseRequest
    {
        public string Response { get; set; } = string.Empty;
        public int TotalPromptTokens { get; set; }
        public int TotalResponseTokens { get; set; }
    }
}
