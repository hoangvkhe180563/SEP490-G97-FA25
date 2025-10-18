using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IAppUserRepository
    {
        //chứa tên các method để thao tác với database. (CRUD)
        //các method này sẽ được implement ở tầng infrastructure.
        public List<AppUser> GetAllUsers();

        public (List<AppUser>, int, int) GetAppUsersBySearchAndFilter(string? status, string? roleId, string? search, int page, int limit);
        public AppUser? GetByEmail(string email);
        public AppUser? GetById(Guid id);
    public void CreateUser(AppUser user, IEnumerable<Guid>? roleIds = null);
    public void UpdateUser(AppUser user, IEnumerable<Guid>? roleIds = null);
        // get roles assigned to a user (a user can have multiple roles)
        public List<AppRole> GetRolesForUser(Guid userId);
        // get user-specific claims/assignments (classes, subjects)
        public List<AppClaim> GetClaimsForUser(Guid userId);
        // helper to get related names
        public string? GetSchoolName(int? schoolId);
        public string? GetCommuneName(int? communeId);
        // get province and city names given a commune id
        public (string? provinceName, string? cityName) GetProvinceAndCityNamesByCommuneId(int? communeId);
    // find role by name
    public AppRole? GetRoleByName(string roleName);
        // find user by refresh token
        public AppUser? GetByRefreshToken(string refreshToken);
        // find user by reset token
        public AppUser? GetByResetToken(string resetToken);
        // update reset token fields
        public void UpdateResetToken(Guid userId, string? resetToken, DateTime? expire);
        // find user by email verification token
        public AppUser? GetByEmailVerificationToken(string token);
        // update email verification token fields
        public void UpdateEmailVerificationToken(Guid userId, string? token, DateTime? expire);
    }
}
