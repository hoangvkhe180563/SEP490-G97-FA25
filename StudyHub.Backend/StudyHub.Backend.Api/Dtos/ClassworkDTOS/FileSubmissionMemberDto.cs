namespace StudyHub.Backend.Api.Dtos.ClassworkDTOS
{
    public class FileSubmissionMemberDto
    {
        public Guid StudentID { get; set; }
        public string StudentName { get; set; }
        public string StudentEmail { get; set; }
        public int ClassID { get; set; }
        public int ClassworkID { get; set; }
        public int SubmissionId { get; set; }
        public string FileName { get; set; }
        public string FileUrl { get; set; }
        public DateTime SubmitAt { get; set; }
    }
}
