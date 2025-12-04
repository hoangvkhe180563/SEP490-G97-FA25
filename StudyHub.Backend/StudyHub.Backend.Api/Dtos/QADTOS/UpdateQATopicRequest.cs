namespace StudyHub.Backend.Api.Dtos.QADTOS
{
    public class UpdateQATopicRequest
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public int SubjectId { get; set; }
        public string? Description { get; set; }
        // If null, do not change; otherwise set accordingly
        public bool? IsActive { get; set; }
    }
}
