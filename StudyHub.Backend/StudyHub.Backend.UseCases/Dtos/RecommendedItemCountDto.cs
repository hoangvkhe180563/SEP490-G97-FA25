namespace StudyHub.Backend.UseCases.Dtos
{
    public class RecommendedItemCountDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Subject { get; set; }
        // Optional image for course (imageUrl) or document thumbnail
        public string? ImageUrl { get; set; }
        public string? Thumbnail { get; set; }
        public int Count { get; set; }
    }
}
