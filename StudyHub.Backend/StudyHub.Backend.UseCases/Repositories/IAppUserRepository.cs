using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IAppUserRepository
    {
        public List<AppUser> GetAllUsers();

        public (List<AppUser>, int, int, int, int) GetAppUsersBySearchAndFilter(string? status, string? roleId, string? search, int page, int limit);
        public AppUser? GetByEmail(string email);
        public AppUser? GetByUsername(string username);
        public AppUser? GetById(Guid id);
        public AppUser? GetByTransferId(int id);
        public void CreateUser(AppUser user, IEnumerable<Guid>? roleIds = null);
        // Create multiple users in a single operation and attach roles to each user
        public void CreateUsersWithRoles(IEnumerable<(AppUser user, IEnumerable<Guid>? roleIds)> usersWithRoles);
        public void UpdateUser(AppUser user, IEnumerable<Guid>? roleIds = null);

    // Get all users who have a teacher-related role (role name contains "teacher")
    public List<AppUser> GetQATeachers();

    // Get QA teachers who teach a given subject (by subject id)
    public List<AppUser> GetQATeachersBySubject(short subjectId);

    // get user-specific subject/class assignments
        public List<AppUserSubjectClass> GetClaimsForUser(Guid userId);
        // helper to get related names

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
