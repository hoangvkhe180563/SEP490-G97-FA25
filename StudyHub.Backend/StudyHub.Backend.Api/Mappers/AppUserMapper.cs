using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.Api.Mappers
{
    public class AppUserMapper
    {
        //map từ entity sang dto
        public static Dtos.AppUserDTOS.AppUserListDto ToAppUserList(PagedResult<UseCases.Dtos.AppUserListDto> users)
        {
            return new Dtos.AppUserDTOS.AppUserListDto
            {
                PagedResult = users
            };
        }

        // Map a domain AppUser to API AppUserDetailDto. The caller should provide role names and school/commune names if available.
        public static Dtos.AppUserDTOS.AppUserDetailDto ToAppUserDetail(StudyHub.Backend.Domain.Entities.AppUser user, IEnumerable<string>? roles = null, string? schoolName = null, string? communeName = null, string? cityName = null, string? provinceName = null)
        {
            return new Dtos.AppUserDTOS.AppUserDetailDto
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                Fullname = user.Fullname,
                Gender = user.Gender ? "Male" : "Female",
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
        public static UseCases.Dtos.AppUserListDto ToAppUserListItem(StudyHub.Backend.Domain.Entities.AppUser user, IEnumerable<string>? roles = null)
        {
            return new UseCases.Dtos.AppUserListDto
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                Fullname = user.Fullname,
                Status = (user.Status == true) ? "Active" : "Inactive",
                CreatedAt = user.CreatedAt.ToString("yyyy/MM/dd"),
                Roles = roles?.ToList() ?? new List<string>()
            };
        }
    }
}
