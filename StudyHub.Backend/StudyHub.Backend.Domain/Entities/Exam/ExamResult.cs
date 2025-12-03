namespace StudyHub.Backend.Domain.Entities.Exam
{
    public class ExamResult
    {
        public string Id { get; set; } = string.Empty;
        public int ExamId { get; set; }
        public List<ExamAnswer> Answers { get; set; } = new List<ExamAnswer>();
        public Guid StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public int CheatTimes { get; set; } = 0;
        public DateTime FinishTime { get; set; }
        public DateTime? SubmissionTime { get; set; }
        public int TotalQuestions { get; set; }
        public decimal Score { get; set; }
    }
}
