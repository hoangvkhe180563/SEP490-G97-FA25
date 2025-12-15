using StudyHub.Backend.Api.Dtos.ClassDTOS;
using StudyHub.Backend.Api.Dtos.ClassDTOS.ClassDTOHelper;

namespace StudyHub.Backend.Api.Dtos.ClassworkDTOS
{
    public class EditClassworkDto
    {
        public string Title { get; set; } = "";
        public string? Description { get; set; }
        public DateTime? Deadline { get; set; }
        public decimal? MaxScore { get; set; }
        public string? GradeType { get; set; }
        public bool AllowSubmission { get; set; } = false;
        public string? InstructionsHtml { get; set; }
        public List<IFormFile>? Files { get; set; }
        public int[]? KeptFileIds { get; set; }
        // Raw incoming JSON string (from form-data)
        public string? LinksJson { get; set; }

        // Always-return list (never null)
        public List<CreateNotificationDto.LinkItem> Links
        {
            get
            {
                return ParseJson.ParseLinksJson(LinksJson);
            }
        }
       
    }
}
