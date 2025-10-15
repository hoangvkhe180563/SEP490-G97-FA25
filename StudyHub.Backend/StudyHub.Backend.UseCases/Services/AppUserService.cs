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
        private readonly IConfiguration _configuration;

        public AppUserService(IAppUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public StudyHub.Backend.UseCases.Dtos.PagedResult<UserListDto> GetAppUsers(string? status = null, string? role = null, string? search = null, int page = 1, int limit = 10)
        {
            // get all users (small to medium datasets). For large datasets implement DB-side filters/paging.
            var users = _userRepository.GetAllUsers();

            // apply status filter
            if (!string.IsNullOrEmpty(status))
            {
                if (status.Equals("active", StringComparison.OrdinalIgnoreCase))
                    users = users.Where(u => u.Status == true).ToList();
                else if (status.Equals("inactive", StringComparison.OrdinalIgnoreCase))
                    users = users.Where(u => u.Status == false).ToList();
            }

            // apply role filter (role name)
            if (!string.IsNullOrEmpty(role))
            {
                users = users.Where(u =>
                {
                    var roles = _userRepository.GetRolesForUser(u.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!.ToLower()).ToList();
                    return roles.Contains(role.ToLower());
                }).ToList();
            }

            // apply search (email, username, fullname)
            if (!string.IsNullOrEmpty(search))
            {
                var q = search.ToLower();
                users = users.Where(u => (u.Email ?? "").ToLower().Contains(q) || (u.Username ?? "").ToLower().Contains(q) || (u.Fullname ?? "").ToLower().Contains(q)).ToList();
            }

            var total = users.Count;
            var totalPages = (int)Math.Ceiling(total / (double)limit);
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;

            var paged = users.Skip((page - 1) * limit).Take(limit).ToList();

            var items = new List<UserListDto>();
            foreach (var u in paged)
            {
                var roles = _userRepository.GetRolesForUser(u.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
                var schoolName = _userRepository.GetSchoolName(u.SchoolId);
                var communeName = _userRepository.GetCommuneName(u.CommuneId);

                items.Add(new UserListDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    Username = u.Username,
                    Fullname = u.Fullname,
                    Address = u.Address,
                    Status = (u.Status == true) ? "Active" : "Inactive",
                    CreatedAt = u.CreatedAt.ToString("yyyy/MM/dd"),
                    UpdatedAt = u.UpdatedAt?.ToString("yyyy/MM/dd"),
                    SchoolName = schoolName,
                    Roles = roles,
                    CommuneName = communeName
                });
            }

            return new StudyHub.Backend.UseCases.Dtos.PagedResult<UserListDto>
            {
                Items = items,
                Total = total,
                Page = page,
                Limit = limit,
                TotalPages = totalPages
            };
        }

        /// <summary>
        /// Signs up a new user with the given email, password, and username.
        /// </summary>
        /// <param name="email">The email address of the new user.</param>
        /// <param name="password">The password of the new user.</param>
        /// <param name="username">The username of the new user.</param>
        /// <param name="fullname">The full name of the new user.</param>
        /// <param name="communeId">The commune id of the new user.</param>
        /// <returns>The newly created <see cref="AppUser"/> if the sign up is successful, otherwise null.</returns>
        public AppUser? Signup(string email, string password, string username, int communeId, string? fullname = null)
        {
            // Check if the email already exists, if it does, return null
            var existing = _userRepository.GetByEmail(email);
            if (existing != null) return null;

            // Hash the password
            string hash = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = hash,
                Username = username,
                Fullname = fullname,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CommuneId = communeId
            };

            _userRepository.CreateUser(user);
            return user;
        }

        // Admin / management methods
        public UserDetailsDto? GetUserById(Guid id)
        {
            var user = _userRepository.GetById(id);
            if (user == null) return null;
            var roles = _userRepository.GetRolesForUser(user.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
            var schoolName = _userRepository.GetSchoolName(user.SchoolId);
            var communeName = _userRepository.GetCommuneName(user.CommuneId);
            return new UserDetailsDto
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                Fullname = user.Fullname,
                Address = user.Address,
                Status = (user.Status == true) ? "Active" : "Inactive",
                CreatedAt = user.CreatedAt.ToString("yyyy/MM/dd"),
                UpdatedAt = user.UpdatedAt?.ToString("yyyy/MM/dd"),
                SchoolName = schoolName,
                Roles = roles,
                CommuneName = communeName
            };
        }

        public AppUser CreateAccount(string email, string password, string username, Guid roleId, int communeId, string? fullname = null)
        {
            var existing = _userRepository.GetByEmail(email);
            if (existing != null) throw new InvalidOperationException("Email already exists");

            string hash = BCrypt.Net.BCrypt.HashPassword(password);
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
                Status = true
            };

            _userRepository.CreateUser(user);
            return user;
        }

        public AppUser? EditAccount(Guid id, string? email = null, string? username = null, string? fullname = null, int? communeId = null, bool? status = null)
        {
            var user = _userRepository.GetById(id);
            if (user == null) return null;

            if (!string.IsNullOrEmpty(email)) user.Email = email;
            if (!string.IsNullOrEmpty(username)) user.Username = username;
            if (!string.IsNullOrEmpty(fullname)) user.Fullname = fullname;
            if (communeId.HasValue) user.CommuneId = communeId.Value;
            if (status.HasValue) user.Status = status.Value;
            user.UpdatedAt = DateTime.UtcNow;

            _userRepository.UpdateUser(user);
            return user;
        }

        public bool DeactivateAccount(Guid id)
        {
            var user = _userRepository.GetById(id);
            if (user == null) return false;
            user.Status = false;
            user.UpdatedAt = DateTime.UtcNow;
            _userRepository.UpdateUser(user);
            return true;
        }

        /// <summary>
        /// Attempts to log in a user with the given email and password.
        /// </summary>
        /// <param name="email">The email address of the user to log in.</param>
        /// <param name="password">The password of the user to log in.</param>
        /// <returns>A <see cref="TokenPair"/> containing the access token and refresh token if the login is successful, otherwise null.</returns>
        public LoginResult? Login(string email, string password)
        {
            // Get the user by email
            var user = _userRepository.GetByEmail(email);
            if (user == null) return null;

            // Check if the user has a password hash
            if (string.IsNullOrEmpty(user.PasswordHash)) return null;

            // Verify the password
            bool ok = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
            if (!ok) return null;

            // Load roles and user claims and create a jwt access token including permissions
            var roles = _userRepository.GetRolesForUser(user.Id);
            var userClaims = _userRepository.GetClaimsForUser(user.Id);
            // Create minimal access token (we will store only id, email, name, roleId in token)
            var accessResult = JwtUtils.CreateAccessToken(user, roles, userClaims, _configuration, includePermissions: false);
            var accessToken = accessResult.Token;

            // Generate a refresh token and persist
            var jwtSection = _configuration.GetSection("JwtSettings");
            var refreshToken = JwtUtils.GenerateRefreshToken();
            var refreshExpireMinutes = jwtSection.GetValue<int?>("RefreshExpiresMinutes") ?? (60 * 24 * 7); // default 7 days
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpire = DateTime.UtcNow.AddMinutes(refreshExpireMinutes);
            _userRepository.UpdateUser(user);

            return new LoginResult
            {
                Tokens = new TokenPair
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    RefreshTokenExpire = user.RefreshTokenExpire ?? DateTime.UtcNow.AddMinutes(refreshExpireMinutes)
                },
                User = user,
                Roles = roles,
                Claims = userClaims
            };
        }

        /// <summary>
        /// Logs out a user with the given id.
        /// </summary>
        /// <param name="userId">The id of the user to log out.</param>
        public void Logout(Guid userId)
        {
            // With stateless JWT, logout is usually handled on the client by removing the token.
            // Optionally we can implement refresh token invalidation here by clearing the stored refresh token.
            // This approach is useful if you want to invalidate all existing refresh tokens for a user,
            // e.g. when the user changes their password.
            var user = _userRepository.GetById(userId);
            if (user == null) return;

            // Clear the stored refresh token to invalidate it.
            user.RefreshToken = null;
            user.RefreshTokenExpire = null;

            // Update the user in the database.
            _userRepository.UpdateUser(user);
        }

        public bool ActivateAccount(Guid id)
        {
            var user = _userRepository.GetById(id);
            if (user == null) return false;
            user.Status = true;
            user.UpdatedAt = DateTime.UtcNow;
            _userRepository.UpdateUser(user);
            return true;
        }
    }

    // Result returned by Login: includes tokens (kept in cookies), plus user info to send in response body
    public class LoginResult
    {
        public TokenPair Tokens { get; set; } = new TokenPair();
        public AppUser User { get; set; } = new AppUser();
        public List<AppRole> Roles { get; set; } = new List<AppRole>();
        public List<AppClaim> Claims { get; set; } = new List<AppClaim>();
    }
}
