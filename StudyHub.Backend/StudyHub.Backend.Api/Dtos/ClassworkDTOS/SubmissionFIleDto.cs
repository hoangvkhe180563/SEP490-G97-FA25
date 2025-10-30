using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.Api.Dtos.ClassworkDTOS
{
    public class SubmissionFIleDto
    {
        public int Id { get; set; }

        public int ClassworkId { get; set; }

        public Guid AppUserId { get; set; }

        public DateTime FirstSubmissionTime { get; set; }

        public DateTime LatestSubmissionTime { get; set; }

        public virtual ICollection<SubmissionFile> SubmissionFiles { get; set; } = new List<SubmissionFile>();
    }
}
