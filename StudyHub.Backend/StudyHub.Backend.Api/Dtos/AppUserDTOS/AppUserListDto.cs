namespace StudyHub.Backend.Api.Dtos.AppUserDTOS
{
    public class AppUserListDto
    {
        public string Message { get; set; } = null!;
        public List<UseCases.Dtos.AppUserListDto> Data { get; set; } = new List<UseCases.Dtos.AppUserListDto>();

        public Meta Meta { get; set; } = null!;
    }

    public class Meta
    {
        public int Page { get; set; }
        public int Limit { get; set; }
        public int Total { get; set; }
        public int TotalPages { get; set; }
    }
}
