namespace StudyHub.Backend.Api.Dtos.QADTOS
{
    public class QATopicResponse
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public short SubjectId { get; set; }
        public string SubjectName { get; set; } = null!;
        public string Description { get; set; } = null!;
        public bool IsActive { get; set; }
    }
}
