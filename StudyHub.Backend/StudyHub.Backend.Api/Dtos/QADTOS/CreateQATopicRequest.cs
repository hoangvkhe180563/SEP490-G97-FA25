namespace StudyHub.Backend.Api.Dtos.QADTOS
{
    public class CreateQATopicRequest
    {
        public string Name { get; set; } = null!;
        public int SubjectId { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
