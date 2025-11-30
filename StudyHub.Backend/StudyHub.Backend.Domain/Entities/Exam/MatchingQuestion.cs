namespace StudyHub.Backend.Domain.Entities.Exam
{
    public class MatchingQuestion : Question
    {
        public required List<string> Terms { get; set; } = new List<string>();
        public required List<string> Definitions { get; set; } = new List<string>();
        public required Dictionary<int, int> CorrectAnswer { get; set; } = new Dictionary<int, int>();
    }
}
