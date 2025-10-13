using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.Api.Mappers
{
    public class AppUserMapper
    {
        //map từ entity sang dto
        public static AppUserListDto ToAppUserList(AppUser user)
        {
            return new AppUserListDto();
        }
    }
}
