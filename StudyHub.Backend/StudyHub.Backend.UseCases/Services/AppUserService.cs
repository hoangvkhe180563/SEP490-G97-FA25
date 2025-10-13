using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class AppUserService
    {
        //thực hiện use case ở đây
        //gọi repo để thao tác với database, sau đó xử lý data lấy về từ repo.
        public IAppUserRepository _userRepository;
        public AppUserService(IAppUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public List<AppUser> GetAppUsers()
        {
            //có thể cho điều kiện lọc, sort, phân trang... ở đây
            return _userRepository.GetAllUsers();
        }
    }
}
