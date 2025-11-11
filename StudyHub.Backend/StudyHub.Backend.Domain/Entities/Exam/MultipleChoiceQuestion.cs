namespace StudyHub.Backend.Domain.Entities.Exam
{
    public class MultipleChoiceQuestion : Question
    {
        public required List<string> Options { get; set; } = new List<string>();
        public required List<int> CorrectAnswer { get; set; } = new List<int>();
    }
}
