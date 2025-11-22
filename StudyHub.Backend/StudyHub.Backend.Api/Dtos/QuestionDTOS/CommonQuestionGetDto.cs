namespace StudyHub.Backend.Api.Dtos.QuestionDTOS
{
    public class CommonQuestionGetDto
    {
        public int SubjectId { get; set; }
        public int Grade { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }
}
