using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;

namespace StudyHub.Backend.UseCases.Services
{
    public class AppUserService
    {
        //thực hiện use case ở đây
        //gọi repo để thao tác với database, sau đó xử lý data lấy về từ repo.
        public IAppUserRepository _userRepository;
        public IAppRoleRepository _roleRepository;
        private readonly IConfiguration _configuration;
        private const int SALT_ROUNDS = 12; // BCrypt salt rounds for hashing

        public AppUserService(IAppUserRepository userRepository, IAppRoleRepository roleRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
            _configuration = configuration;
        }

        public PagedResult<AppUserListDto> GetAppUsers(string? status, string? role, string? search, int page, int limit)
        {
            var (users, total, totalPages) = _userRepository.GetAppUsersBySearchAndFilter(status, role, search, page, limit);

            var items = new List<AppUserListDto>();
            foreach (var u in users)
            {
                var roles = _roleRepository.GetRolesForUser(u.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();

                items.Add(new AppUserListDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    Username = u.Username,
                    Fullname = u.Fullname,
                    Status = (u.Status == true) ? "Active" : "Inactive",
                    CreatedAt = u.CreatedAt.ToString("yyyy/MM/dd"),
                    Roles = roles,
                });
            }

            return new PagedResult<AppUserListDto>
            {
                Items = items,
                Total = total,
                Page = page,
                Limit = limit,
                TotalPages = totalPages
            };
        }

        // Admin / management methods
        public AppUser? GetUserById(Guid id)
        {
            // Return the domain AppUser and let the API layer map/format the data for clients.
            var user = _userRepository.GetById(id);
            return user;
        }

        public AppUser CreateAccount(string email, string password, string username, IEnumerable<Guid>? roleIds, int communeId, string? fullname = null, string? avatar = null, int gender = 0)
        {
            var existing = _userRepository.GetByEmail(email);
            if (existing != null) throw new InvalidOperationException("Email already exists");

            string hash = BCrypt.Net.BCrypt.HashPassword(password, SALT_ROUNDS);
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = hash,
                Username = username,
                Fullname = fullname,
                CommuneId = communeId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Status = true,
                Avatar = avatar,
                Gender = (gender == 1)
            };

            try
            {
                _userRepository.CreateUser(user, roleIds);
                return user;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Failed to create account: " + ex.Message, ex);
            }
        }

        public AppUser? EditAccount(Guid id, string? email = null, string? username = null, string? fullname = null, int? communeId = null, bool? status = null, string? avatar = null, int? gender = null, IEnumerable<Guid>? roleIds = null)
        {
            var user = _userRepository.GetById(id);
            if (user == null) return null;

            if (!string.IsNullOrEmpty(email)) user.Email = email;
            if (!string.IsNullOrEmpty(username)) user.Username = username;
            if (!string.IsNullOrEmpty(fullname)) user.Fullname = fullname;
            if (communeId.HasValue) user.CommuneId = communeId.Value;
            if (status.HasValue) user.Status = status.Value;
            if (!string.IsNullOrEmpty(avatar)) user.Avatar = avatar;
            if (gender.HasValue) user.Gender = (gender.Value == 1);
            user.UpdatedAt = DateTime.UtcNow;

            try
            {
                _userRepository.UpdateUser(user, roleIds);
                return user;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Failed to update account: " + ex.Message, ex);
            }
        }

        public bool DeactivateAccount(Guid id)
        {
            var user = _userRepository.GetById(id);
            if (user == null) return false;
            user.Status = false;
            user.UpdatedAt = DateTime.UtcNow;
            try
            {
                _userRepository.UpdateUser(user);
                return true;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Failed to deactivate account: " + ex.Message, ex);
            }
        }

        public bool ActivateAccount(Guid id)
        {
            var user = _userRepository.GetById(id);
            if (user == null) return false;
            user.Status = true;
            user.UpdatedAt = DateTime.UtcNow;
            try
            {
                _userRepository.UpdateUser(user);
                return true;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Failed to activate account: " + ex.Message, ex);
            }
        }
    }
}
