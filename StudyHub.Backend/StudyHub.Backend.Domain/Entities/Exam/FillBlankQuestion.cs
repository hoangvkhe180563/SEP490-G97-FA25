namespace StudyHub.Backend.Domain.Entities.Exam
{
    public class FillBlankQuestion : Question
    {
        public required List<string> CorrectAnswer { get; set; } = new List<string>();
    }
}
