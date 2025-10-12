using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class AppUserRepository : IAppUserRepository
    {
        //implement các thao tác database từ bên UseCases vào đây
        private readonly AppDbContext _context;
        public AppUserRepository(AppDbContext context)
        {
            _context = context;
        }
        public List<Domain.Entities.AppUser> GetAllUsers()
        {
            try
            {
                Console.WriteLine(_context.Cities.Count());
            }
            catch (Exception ex)
            {
                new InfrastructureException("AppUserRepository", "Cannot connect db. Inner error: " + ex.Message).LogError();
            }
            //return db.appuser.tolist()
            Console.WriteLine("get all user");
            return [];
        }
    }
}
