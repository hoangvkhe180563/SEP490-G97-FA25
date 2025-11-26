namespace StudyHub.Backend.UseCases.Dtos
{
    public class DocumentRecommendationResult
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public double Score { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string DocumentCategoryName { get; set; } = string.Empty;
        public string DocumentCategoryDescription { get; set; } = string.Empty;
        public string Thumbnail { get; set; } = string.Empty;
        public string DocumentLevel { get; set; } = string.Empty;
        public string DocumentLengthType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string DocumentUrl { get; set; } = string.Empty;
    }
}
