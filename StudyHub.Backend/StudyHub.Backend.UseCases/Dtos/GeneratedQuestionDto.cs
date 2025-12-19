using StudyHub.Backend.Domain.Entities.Exam;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class GeneratedQuestionDto
    {
        public string QuestionText { get; set; } = string.Empty;
        // question type code: 0=SingleChoice, 1=MultipleChoice, 2=TextInput, 3=FillBlank, 4=Matching
        public QuestionType? QuestionType { get; set; }

        // For choice questions
        public List<string>? Options { get; set; }

        // SingleChoice: index into Options (0-based)
        public int? CorrectAnswerIndex { get; set; }

        // MultipleChoice: list of indexes into Options (0-based)
        public List<int>? CorrectAnswerIndexes { get; set; }

        // TextInput: exact string answer
        public string? CorrectAnswerText { get; set; }

        // FillBlank: array of strings representing each blank's answer in order
        public List<string>? CorrectAnswers { get; set; }

        // Matching: left terms and right definitions plus mapping leftIndex->rightIndex
        public List<string>? Terms { get; set; }
        public List<string>? Definitions { get; set; }
        public Dictionary<int, int>? CorrectAnswerMap { get; set; }
    }
}
