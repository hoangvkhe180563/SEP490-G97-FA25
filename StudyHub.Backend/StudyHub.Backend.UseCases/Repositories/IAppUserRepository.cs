using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IAppUserRepository
    {
        //chứa tên các method để thao tác với database. (CRUD)
        //các method này sẽ được implement ở tầng infrastructure.
        public List<AppUser> GetAllUsers();
    }
}
