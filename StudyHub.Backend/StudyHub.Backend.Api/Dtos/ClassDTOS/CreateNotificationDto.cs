using System.Text.Json;

namespace StudyHub.Backend.Api.Dtos.ClassDTOS
{
        public class CreateNotificationDto
        {
            // Basic
            public int ClassId { get; set; }
            public string Type { get; set; } = "notification"; // "notification" | "classwork"
            public string Title { get; set; } = string.Empty;
            public string? Description { get; set; }

            public Guid CreatedBy { get; set; }
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

            public List<IFormFile>? Files { get; set; }

            public string? LinksJson { get; set; }
            public List<LinkItem>? Links
            {
                get
                {
                    if (!string.IsNullOrWhiteSpace(LinksJson))
                    {
                        try
                        {
                            return JsonSerializer.Deserialize<List<LinkItem>>(LinksJson!);
                        }
                        catch
                        {
                            return null;
                        }
                    }
                    return null;
                }
            }

            public DateTime? Deadline { get; set; }
            public decimal? MaxScore { get; set; }
            public string? GradeType { get; set; }
            public bool AllowSubmission { get; set; } = false;
            public string? InstructionsHtml { get; set; }
        }

        public class LinkItem
        {
            public string Url { get; set; } = string.Empty;
            public string? Title { get; set; }
            public string? Thumbnail { get; set; }
            // optional kind: "link", "youtube", "drive", etc.
            public string? Kind { get; set; }
        }
}
