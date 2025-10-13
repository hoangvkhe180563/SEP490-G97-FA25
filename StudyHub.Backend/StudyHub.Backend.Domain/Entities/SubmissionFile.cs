namespace StudyHub.Backend.Domain.Entities
{
    public class SubmissionFile
    {
        public int Id { get; set; }
        public int SubmissionId { get; set; }
        public string? FileName { get; set; }
    }
}
