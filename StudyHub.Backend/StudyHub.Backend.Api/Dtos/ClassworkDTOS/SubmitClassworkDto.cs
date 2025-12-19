using StudyHub.Backend.Api.Dtos.ClassDTOS;

namespace StudyHub.Backend.Api.Dtos.ClassworkDTOS
{
    public class SubmitClassworkDto
    {
        public Guid AppUserId { get; set; } 
        public List<IFormFile> Files { get; set; } = new();
    }
}
