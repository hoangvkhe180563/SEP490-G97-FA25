namespace StudyHub.Backend.Api.Dtos.ClassDTOS
{
    public class CreateNotificationDto
    {
        public int ClassId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // support multiple files (key = "Files")
        public List<IFormFile>? Files { get; set; }

        // optional fallback JSON links array (stringified)
        public string? LinksJson { get; set; }
    }

    public class LinkItem
    {
        public string Url { get; set; } = string.Empty;
        public string? Title { get; set; }
        public string? Thumbnail { get; set; }
        public string? Kind { get; set; } // optional: "link" or "youtube"
    }
}
