using System;

namespace StudyHub.Backend.Api.Dtos.RecommendDTOS
{
    public class LlmHistoryResponseDto
    {
        public int Id { get; set; }
        public string? InputText { get; set; }
        public string? Llmresponse { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
