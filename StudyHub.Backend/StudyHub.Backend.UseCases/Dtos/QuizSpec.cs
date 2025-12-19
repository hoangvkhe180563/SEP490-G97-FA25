using System.Collections.Generic;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class QuizSpec
    {
        public int NumQuestions { get; set; }
        public string QuestionType { get; set; } = string.Empty;
        public List<string> Keywords { get; set; } = new List<string>();
        // Changed to a list to represent multiple subject names the user owns
        public List<string> Subject { get; set; } = new List<string>();
        public int? Grade { get; set; }
    }
}
