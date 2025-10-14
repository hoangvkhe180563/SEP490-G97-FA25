using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using StudyHub.Backend.Domain.Entities;
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

        public List<AppUser> GetAppUsers()
        {
            //có thể cho điều kiện lọc, sort, phân trang... ở đây
            return _userRepository.GetAllUsers();
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
                EmailConfirmed = false,
                CommuneId = communeId
            };

            _userRepository.CreateUser(user);
            return user;
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
