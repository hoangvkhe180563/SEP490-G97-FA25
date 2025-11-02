using StudyHub.Backend.Api.Dtos.AppUserDTOS;
using StudyHub.Backend.Api.Dtos.AuthDTOS;
using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.Api.Mappers
{
    public class AuthMapper
    {
        public static UserInfoResponse ToUserInfoResponse(LoginResult result)
        {
            return new UserInfoResponse
            {
                Id = result.User.Id,
                Email = result.User.Email,
                Username = result.User.Username,
                Fullname = result.User.Fullname,
                Avatar = result.User.Avatar,
                Roles = result.Roles ?? new List<string>(),
                Permissions = result.Permissions ?? new List<string>(),
                ClassIds = result.ClassIds ?? new List<int>(),
                SubjectIds = result.SubjectIds ?? new List<short>(),
                SchoolId = result.User.SchoolId,
                IsLoginWithGoogle = result.User.IsLoginWithGoogle,
                TransferId = result.User.TransferId
            };
        }
    }
}
