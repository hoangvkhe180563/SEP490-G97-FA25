namespace StudyHub.Backend.Domain.Entities.Exam
{
    public class ExamResult
    {
        public string Id { get; set; } = string.Empty;
        public int ExamId { get; set; }
        public required List<ExamAnswer> Answers { get; set; } = new List<ExamAnswer>();
        public required Guid StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public int CheatTimes { get; set; } = 0;
        public required DateTime FinishTime { get; set; }
        public DateTime SubmissionTime { get; set; }
        public int TotalQuestions
        {
            get => Answers.Count;
        }
    }
}
