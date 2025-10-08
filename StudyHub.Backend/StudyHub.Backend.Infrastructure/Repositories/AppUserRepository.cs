using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class AppUserRepository : IAppUserRepository
    {
        //implement các thao tác database từ bên UseCases vào đây
        public List<AppUser> GetAllUsers()
        {
            //return db.appuser.tolist()
            Console.WriteLine("get all user");
            return [];
        }
    }
}
