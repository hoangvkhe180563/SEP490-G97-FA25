namespace StudyHub.Backend.Api.Dtos.ClassDTOS
{
    public class ClassDetailDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public short? SubjectId { get; set; }

        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; }

        public Guid CreatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public Guid? UpdatedBy { get; set; }

        public DateTime? DeletedAt { get; set; }
    }
}
