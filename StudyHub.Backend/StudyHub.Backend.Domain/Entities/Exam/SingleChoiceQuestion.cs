namespace StudyHub.Backend.Domain.Entities.Exam
{
    public class SingleChoiceQuestion : Question
    {
        public required List<string> Options { get; set; } = new List<string>();
        public required int CorrectAnswer { get; set; }
    }
}
