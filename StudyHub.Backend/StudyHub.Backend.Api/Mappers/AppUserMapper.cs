using StudyHub.Backend.Api.Dtos.AppUserDTOS;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.Api;
using System.Linq;
using StudyHub.Backend.Api.Dtos;

namespace StudyHub.Backend.Api.Mappers
{
    public class AppUserMapper
    {

        // Map a domain AppUser to API AppUserDetailDto. The caller should provide role names and school/commune names if available.
        public static AppUserDetailDto ToAppUserDetail(Domain.Entities.AppUser user, IEnumerable<string>? roles = null, int? schoolId = null, int? communeId = null, int? cityId = null, int? provinceId = null)
        {
            return new AppUserDetailDto
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                Fullname = user.Fullname,
                Gender = user.Gender,
                Avatar = user.Avatar,
                Address = user.Address,
                PhoneNumber = user.PhoneNumber,
                Dob = user.Dob,
                Status = user.Status,
                CreatedAt = user.CreatedAt.ToString("yyyy/MM/dd"),
                UpdatedAt = user.UpdatedAt?.ToString("yyyy/MM/dd"),
                SchoolId = schoolId,
                CityId = cityId,
                ProvinceId = provinceId,
                Roles = roles?.ToList() ?? new List<string>(),
                CommuneId = communeId
                ,
                Subjects = user.Subjects?.Select(s => new SubjectDto { Id = s.Id, Name = s.Name })?.ToList() ?? new List<SubjectDto>()
            };
        }

        public static ProfileResponse ToProfile(Domain.Entities.AppUser user, IEnumerable<string>? roles = null, int? schoolId = null, int? communeId = null, int? cityId = null, int? provinceId = null)
        {
            return new ProfileResponse
            {
                Email = user.Email,
                Username = user.Username,
                Fullname = user.Fullname,
                Gender = user.Gender,
                Avatar = user.Avatar,
                Address = user.Address,
                PhoneNumber = user.PhoneNumber,
                Dob = user.Dob,
                Status = user.Status,
                CreatedAt = user.CreatedAt.ToString("yyyy/MM/dd"),
                UpdatedAt = user.UpdatedAt?.ToString("yyyy/MM/dd"),
                SchoolId = schoolId,
                CityId = cityId,
                ProvinceId = provinceId,
                Roles = roles?.ToList() ?? new List<string>(),
                CommuneId = communeId,
                Subjects = user.Subjects?.Select(s => new SubjectDto { Id = s.Id, Name = s.Name })?.ToList() ?? new List<SubjectDto>()
            };
        }


        // Map a domain AppUser to a compact list item use-case DTO (keeps compatibility with UseCases.PagedResult<AppUserListDto>)
        public static Dtos.AppUserDTOS.AppUserListDto ToAppUserList(PagedResult<UseCases.Dtos.AppUserListDto> result)
        {
            return new Dtos.AppUserDTOS.AppUserListDto
            {
                Success = true,
                Message = "Lấy danh sách người dùng thành công",
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
