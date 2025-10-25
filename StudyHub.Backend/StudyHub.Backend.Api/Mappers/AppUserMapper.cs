using StudyHub.Backend.Api.Dtos.AppUserDTOS;
using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.Api.Mappers
{
    public class AppUserMapper
    {

        // Map a domain AppUser to API AppUserDetailDto. The caller should provide role names and school/commune names if available.
        public static AppUserDetailDto ToAppUserDetail(Domain.Entities.AppUser user, IEnumerable<string>? roles = null, string? schoolName = null, string? communeName = null, string? cityName = null, string? provinceName = null)
        {
            return new AppUserDetailDto
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                Fullname = user.Fullname,
                Gender = user.Gender.HasValue ? (user.Gender.Value ? "Male" : "Female") : null,
                Avatar = user.Avatar,
                Address = user.Address,
                Status = (user.Status == true) ? "Active" : "Inactive",
                CreatedAt = user.CreatedAt.ToString("yyyy/MM/dd"),
                UpdatedAt = user.UpdatedAt?.ToString("yyyy/MM/dd"),
                SchoolName = schoolName,
                CityName = cityName,
                ProvinceName = provinceName,
                Roles = roles?.ToList() ?? new List<string>(),
                CommuneName = communeName
            };
        }


        // Map a domain AppUser to a compact list item use-case DTO (keeps compatibility with UseCases.PagedResult<AppUserListDto>)
        public static Dtos.AppUserDTOS.AppUserListDto ToAppUserList(PagedResult<UseCases.Dtos.AppUserListDto> result)
        {
            return new Dtos.AppUserDTOS.AppUserListDto
            {
                Message = "Success",
                Data = result.Items,
                Meta = new Meta
                {
                    Page = result.Page,
                    Limit = result.Limit,
                    Total = result.Total,
                    TotalPages = result.TotalPages
                }
            };
        }
    }
}
