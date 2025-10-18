namespace StudyHub.Backend.Api.Dtos.AppUserDTOS
{
    public class AppUserListDto
    {
        public UseCases.Dtos.PagedResult<UseCases.Dtos.AppUserListDto> PagedResult { get; set; } = new UseCases.Dtos.PagedResult<UseCases.Dtos.AppUserListDto>();
    }
}
