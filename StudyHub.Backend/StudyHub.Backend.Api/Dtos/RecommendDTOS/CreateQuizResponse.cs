using StudyHub.Backend.UseCases.Dtos;
using System.Collections.Generic;

namespace StudyHub.Backend.Api.Dtos.RecommendDTOS
{
    public class CreateQuizResponse
    {
        public QuizSpec Spec { get; set; } = new QuizSpec();
        //public List<ExampleQuestionDto> Examples { get; set; } = new List<ExampleQuestionDto>();
        public List<GeneratedQuestionDto> GeneratedQuestions { get; set; } = new List<GeneratedQuestionDto>();
    }
}
