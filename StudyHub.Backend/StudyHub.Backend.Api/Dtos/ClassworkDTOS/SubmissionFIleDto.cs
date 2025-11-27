using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.Api.Dtos.ClassworkDTOS
{
    public class SubmissionFileDto
    {
        public int Id { get; set; }
        public int NotificationId { get; set; }
        public int ClassworkId { get; set; }
        public decimal? Score { get; set; }
        public DateTime? GradedAt { get; set; }
        public Guid? GradedBy { get; set; }
        public string GradeByName { get; set; }
        public string Feedback { get; set; }
        public Guid AppUserId { get; set; } = Guid.Empty;
        public string SubmissionStatus { get; set; }

        public DateTime FirstSubmissionTime { get; set; }

        public DateTime LatestSubmissionTime { get; set; }

        public virtual ICollection<SubmissionFile> SubmissionFiles { get; set; } = new List<SubmissionFile>();
    }
}
