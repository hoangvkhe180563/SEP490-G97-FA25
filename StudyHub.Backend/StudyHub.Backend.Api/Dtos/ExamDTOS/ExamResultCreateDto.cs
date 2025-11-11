using StudyHub.Backend.Domain.Entities.Exam;
using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Dtos.ExamDTOS
{
    public class ExamResultCreateDto
    {
        [Required]
        public int ExamId { get; set; }

        [Required]
        public List<ExamAnswer> Answers { get; set; } = new List<ExamAnswer>();

        [Required]
        public Guid StudentId { get; set; }

        [Required]
        public DateTime FinishTime { get; set; }
    }
}
