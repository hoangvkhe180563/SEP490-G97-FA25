using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.Api.Dtos.ClassworkDTOS
{
    public class CreateClassworkDto
    {
        public int ClassId { get; set; }
        public string Title { get; set; } = "";
        public string? Description { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime? Deadline { get; set; }
        public ClassNotification ToEntity() => new ClassNotification { ClassId = ClassId, Title = Title, Description = Description, Deadline = Deadline };
    }
}
