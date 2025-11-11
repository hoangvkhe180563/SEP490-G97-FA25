namespace StudyHub.Backend.Domain.Entities.Exam
{
    public class TextInputQuestion : Question
    {
        public required string CorrectAnswer { get; set; } = string.Empty;
    }
}
