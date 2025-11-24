namespace StudyHub.Backend.Api.Dtos.QuestionDTOS
{
    public class CommonQuestionResponseDto
    {
        public List<QuestionDetailsDto> Questions { get; set; } = new List<QuestionDetailsDto>();
        public int Page { get; set; }
        public int TotalPages { get; set; }
        public int TotalQuestions { get; set; }
    }
}
