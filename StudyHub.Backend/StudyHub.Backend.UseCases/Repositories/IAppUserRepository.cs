using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IAppUserRepository
    {
        public List<AppUser> GetAllUsers();
        public AppUser? GetByEmail(string email);
        public AppUser? GetById(Guid id);
        public void CreateUser(AppUser user);
        public void UpdateUser(AppUser user);
        // get roles assigned to a user (a user can have multiple roles)
        public List<AppRole> GetRolesForUser(Guid userId);
        // get user-specific claims/assignments (classes, subjects)
        public List<AppClaim> GetClaimsForUser(Guid userId);
        // helper to get related names
        public string? GetSchoolName(int? schoolId);
        public string? GetCommuneName(int? communeId);
    }
}
