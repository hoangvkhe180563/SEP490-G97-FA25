using StudyHub.Backend.Domain.Entities.Exam;
using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Dtos.ExamDTOS
{
    public class ExamResultUpdateDto
    {
        [Required]
        public string Id { get; set; } = string.Empty;

        [Required]
        public List<ExamAnswer> Answers { get; set; } = new List<ExamAnswer>();

        [Required]
        public int CheatTimes { get; set; }
    }
}
