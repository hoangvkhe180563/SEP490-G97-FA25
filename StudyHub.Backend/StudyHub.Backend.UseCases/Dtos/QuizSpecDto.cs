using System.Collections.Generic;
using StudyHub.Backend.Domain.Entities.Exam;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class QuizSpecDto
    {
        public int NumQuestions { get; set; }
        public QuestionType QuestionType { get; set; } = QuestionType.SingleChoice;
        public List<string> Keywords { get; set; } = new List<string>();
        public List<string> Subject { get; set; } = new List<string>();
        public int? Grade { get; set; }

        public static QuizSpecDto From(QuizSpec spec)
        {
            var dto = new QuizSpecDto
            {
                NumQuestions = spec?.NumQuestions ?? 0,
                Keywords = spec?.Keywords ?? new List<string>(),
                Subject = spec?.Subject ?? new List<string>(),
                Grade = spec?.Grade
            };

            if (!string.IsNullOrWhiteSpace(spec?.QuestionType))
            {
                // Try parse case-insensitively; fallback to SingleChoice
                if (System.Enum.TryParse<QuestionType>(spec.QuestionType, true, out var qtype))
                {
                    dto.QuestionType = qtype;
                }
            }

            return dto;
        }
    }
}
