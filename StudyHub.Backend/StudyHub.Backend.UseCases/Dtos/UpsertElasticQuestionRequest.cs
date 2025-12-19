using System.Collections.Generic;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class UpsertElasticQuestionRequest
    {
        public string Id { get; set; } = string.Empty;
        public string QuestionText { get; set; } = string.Empty;
        public string? CorrectAnswer { get; set; }
        public int? CorrectAnswerIndex { get; set; }
        public List<string> Options { get; set; } = new List<string>();
        public int? SubjectId { get; set; }
        public int? Grade { get; set; }
    }
}
