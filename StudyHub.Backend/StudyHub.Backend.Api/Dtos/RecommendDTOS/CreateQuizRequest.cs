namespace StudyHub.Backend.Api.Dtos.RecommendDTOS
{
    public class CreateQuizRequest
    {
        public string UserMessage { get; set; } = string.Empty;
        public int? SubjectId { get; set; }
        public int? Grade { get; set; }
    }
}
