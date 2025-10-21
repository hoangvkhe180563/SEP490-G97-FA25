using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;
using System.Net.Http;
using System.Text.Json;
using StudyHub.Backend.Api.Services;

namespace StudyHub.Backend.UseCases.Services
{
    public class AuthService
    {

        public IAppUserRepository _userRepository;
        public IAppRoleRepository _roleRepository;
        public IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private const int SALT_ROUNDS = 12; // BCrypt salt rounds for hashing
        private const int DEFAULT_EXPIRES_MINUTES = 60; // default 60 minutes
        private const int DEFAULT_REFRESH_EXPIRES_MINUTES = 60 * 24 * 7; // default 7 days

        public AuthService(IAppUserRepository userRepository, IAppRoleRepository roleRepository, IEmailService emailService, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
            _emailService = emailService;
            _configuration = configuration;
        }

        /// <summary>
        /// Attempts to log in a user with the given email and password.
        /// </summary>
        /// <param name="email">The email address of the user to log in.</param>
        /// <param name="password">The password of the user to log in.</param>
        /// <returns>A <see cref="TokenPair"/> containing the access token and refresh token if the login is successful, otherwise null.</returns>
        // Returns (result, error)
        // error == null => success
        // error == "unverified" => user exists but not verified
        // error == "invalid" => credentials invalid
        public (LoginResult? result, string? error) Login(string? emailOrUsername, string password)
        {
            // allow login by email or username
            Domain.Entities.AppUser? user = null;
            if (!string.IsNullOrEmpty(emailOrUsername))
            {
                user = _userRepository.GetByEmail(emailOrUsername);
                if (user == null)
                {
                    user = _userRepository.GetByUsername(emailOrUsername);
                }
            }

            if (user == null) return (null, "invalid");

            // Check if the user has a password hash
            if (string.IsNullOrEmpty(user.PasswordHash)) return (null, "invalid");

            // Verify the password
            bool ok = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
            if (!ok) return (null, "invalid");

            if (!user.IsVerified) return (null, "unverified");

            // Load roles and user claims and create a jwt access token including permissions
            var roles = _roleRepository.GetRolesForUser(user.Id);
            var userClaims = _userRepository.GetClaimsForUser(user.Id);
            // Build permissions list from role permissions (format: Resource:Action)
            List<string> permissions = new List<string>();
            if (roles != null)
            {
                permissions = roles.SelectMany(r => r.AppPermissions ?? new List<AppPermission>())
                                    .Select(p => (p.Resource?.Name ?? p.ResourceId.ToString()) + ":" + (p.Action?.Name ?? p.ActionId.ToString()))
                                    .Distinct()
                                    .ToList();
            }

            //Build role names list
            List<string> roleNames = new List<string>();
            if (roles != null)
            {
                roleNames = roles.Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
            }

            // Build subject ids list from user claims
            List<short> subjectIds = new List<short>();
            if (userClaims != null)
            {
                subjectIds = userClaims.Where(c => c.SubjectId > 0).Select(c => c.SubjectId).Distinct().ToList();
            }

            //Build class ids list from user claims
            List<int> classIds = new List<int>();
            if (userClaims != null)
            {
                classIds = userClaims.Where(c => c.ClassId > 0).Select(c => c.ClassId).Distinct().ToList();
            }
            // Create minimal access token (we will store only id, email, name, roleId in token)
            var accessResult = JwtUtils.CreateAccessToken(user, roleNames, _configuration);
            var accessToken = accessResult.Token;

            // Generate a refresh token and persist
            var jwtSection = _configuration.GetSection("JwtSettings");

            var accessTokenExpireMinutes = jwtSection.GetValue<int?>("ExpiresMinutes") ?? DEFAULT_EXPIRES_MINUTES;
            var refreshToken = JwtUtils.GenerateRefreshToken();
            var refreshExpireMinutes = jwtSection.GetValue<int?>("RefreshExpiresMinutes") ?? DEFAULT_REFRESH_EXPIRES_MINUTES;
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpire = DateTime.UtcNow.AddMinutes(refreshExpireMinutes);
            _userRepository.UpdateUser(user);

            var loginResult = new LoginResult
            {
                Tokens = new TokenPair
                {
                    AccessToken = accessToken,
                    AccessTokenExpire = DateTime.UtcNow.AddMinutes(accessTokenExpireMinutes),
                    RefreshToken = refreshToken,
                    RefreshTokenExpire = user.RefreshTokenExpire ?? DateTime.UtcNow.AddMinutes(refreshExpireMinutes)
                },
                User = user,
                Roles = roleNames,
                Permissions = permissions,
                SubjectIds = subjectIds,
                ClassIds = classIds
            };

            return (loginResult, null);
        }

        /// <summary>
        /// Create and persist a DB-backed verification token for the specified email (or null if user not found or already verified).
        /// Returns the token string that should be emailed to the user.
        /// </summary>
        public string? CreateVerificationTokenForEmail(string email)
        {
            var user = _userRepository.GetByEmail(email);
            if (user == null) return null;
            if (user.IsVerified) return null;

            var token = JwtUtils.CreateAccessToken(user, [], _configuration); // cryptographically strong random token
            var expire = DateTime.UtcNow.AddHours(24);
            _userRepository.UpdateEmailVerificationToken(user.Id, token.Token, expire);
            return token.Token;
        }

        /// <summary>
        /// Verify an email using a DB-backed verification token. Returns true on success.
        /// </summary>
        public bool VerifyEmail(string token)
        {
            if (string.IsNullOrEmpty(token)) return false;
            var user = _userRepository.GetByEmailVerificationToken(token);
            if (user == null) return false;
            if (!user.EmailVerificationExpire.HasValue || user.EmailVerificationExpire.Value < DateTime.UtcNow) return false;

            user.IsVerified = true;
            user.UpdatedAt = DateTime.UtcNow;
            // clear token
            user.EmailVerificationToken = null;
            user.EmailVerificationExpire = null;
            _userRepository.UpdateUser(user);
            return true;
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
        public AppUser? Signup(string email, string password, string username, string phoneNumber, int communeId, int? schoolId = null, string? fullname = null, string? avatar = null, int? gender = null)
        {
            // Check if the email already exists, if it does, return null
            var existing = _userRepository.GetByEmail(email);
            if (existing != null) return null;

            // Hash the password
            string hash = BCrypt.Net.BCrypt.HashPassword(password, SALT_ROUNDS);

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = hash,
                Username = username,
                Fullname = fullname,
                PhoneNumber = phoneNumber,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CommuneId = communeId,
                SchoolId = schoolId,
                Avatar = avatar,
                Gender = gender.HasValue ? (gender.Value == 1) : false,

            };
            var roleIds = new List<Guid>
            {
                _roleRepository.GetRoleByName("Student") ?.Id ?? Guid.Empty
            };
            try
            {
                _userRepository.CreateUser(user, roleIds);
                string? token = CreateVerificationTokenForEmail(email);
                if (token != null)
                {
                    _emailService.SendVerificationEmailAsync(email, token);
                }
                return user;
            }
            catch (Exception ex)
            {
                // wrap repository exceptions into a clearer message for controller
                throw new InvalidOperationException("Failed to create user: " + ex.Message, ex);
            }
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

        /// <summary>
        /// Refreshes tokens using a valid refresh token.
        /// </summary>
        public LoginResult? RefreshTokens(string refreshToken)
        {
            if (string.IsNullOrEmpty(refreshToken)) return null;
            var user = _userRepository.GetByRefreshToken(refreshToken);
            if (user == null) return null;
            if (!user.RefreshTokenExpire.HasValue || user.RefreshTokenExpire.Value < DateTime.UtcNow) return null;

            // Build roles/claims again
            var roles = _roleRepository.GetRolesForUser(user.Id);
            var userClaims = _userRepository.GetClaimsForUser(user.Id);

            var accessResult = JwtUtils.CreateAccessToken(user, roles?.Select(r => r.Name ?? string.Empty) ?? Enumerable.Empty<string>(), _configuration);
            var accessToken = accessResult.Token;

            var jwtSection = _configuration.GetSection("JwtSettings");
            var accessTokenExpireMinutes = jwtSection.GetValue<int?>("ExpiresMinutes") ?? DEFAULT_EXPIRES_MINUTES;
            var refreshTokenNew = JwtUtils.GenerateRefreshToken();
            var refreshExpireMinutes = jwtSection.GetValue<int?>("RefreshExpiresMinutes") ?? DEFAULT_REFRESH_EXPIRES_MINUTES;

            user.RefreshToken = refreshTokenNew;
            user.RefreshTokenExpire = DateTime.UtcNow.AddMinutes(refreshExpireMinutes);
            _userRepository.UpdateUser(user);

            return new LoginResult
            {
                Tokens = new TokenPair
                {
                    AccessToken = accessToken,
                    AccessTokenExpire = DateTime.UtcNow.AddMinutes(accessTokenExpireMinutes),
                    RefreshToken = refreshTokenNew,
                    RefreshTokenExpire = user.RefreshTokenExpire ?? DateTime.UtcNow.AddMinutes(refreshExpireMinutes)
                },
                User = user,
                Roles = roles?.Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList() ?? new List<string>(),
                Permissions = roles != null ? roles.SelectMany(r => r.AppPermissions ?? new List<AppPermission>()).Select(p => (p.Resource?.Name ?? p.ResourceId.ToString()) + ":" + (p.Action?.Name ?? p.ActionId.ToString())).Distinct().ToList() : new List<string>(),
                SubjectIds = userClaims != null ? userClaims.Where(c => c.SubjectId > 0).Select(c => c.SubjectId).Distinct().ToList() : new List<short>(),
                ClassIds = userClaims != null ? userClaims.Where(c => c.ClassId > 0).Select(c => c.ClassId).Distinct().ToList() : new List<int>()
            };
        }

        /// <summary>
        /// Login or signup using Google id_token.
        /// </summary>
        public LoginResult? LoginWithGoogle(string idToken)
        {
            if (string.IsNullOrEmpty(idToken)) return null;

            try
            {
                using var http = new HttpClient();
                var url = $"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(idToken)}";
                var resp = http.GetAsync(url).Result;
                if (!resp.IsSuccessStatusCode) return null;
                var content = resp.Content.ReadAsStringAsync().Result;
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;

                // tokeninfo returns email and email_verified among others
                var email = root.GetProperty("email").GetString();
                var emailVerified = root.TryGetProperty("email_verified", out var ev) ? ev.GetString() ?? ev.GetBoolean().ToString() : "false";
                var name = root.TryGetProperty("name", out var nm) ? nm.GetString() : null;
                var picture = root.TryGetProperty("picture", out var pic) ? pic.GetString() : null;

                if (string.IsNullOrEmpty(email)) return null;
                if (!(emailVerified == "true" || emailVerified == "True" || emailVerified == "1")) return null;

                var user = _userRepository.GetByEmail(email);
                if (user == null)
                {
                    // create minimal user
                    user = new AppUser
                    {
                        Id = Guid.NewGuid(),
                        Email = email,
                        Username = email.Split('@')[0],
                        Fullname = name,
                        Avatar = picture,
                        IsLoginWithGoogle = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    };
                    // auto-assign Student role if exists
                    var studentRole = _roleRepository.GetRoleByName("Student");
                    if (studentRole != null)
                    {
                        _userRepository.CreateUser(user, new List<Guid> { studentRole.Id });
                    }
                    else
                    {
                        _userRepository.CreateUser(user);
                    }
                }
                else
                {
                    // ensure flag
                    user.IsLoginWithGoogle = true;
                    if (!string.IsNullOrEmpty(name)) user.Fullname = name;
                    if (!string.IsNullOrEmpty(picture)) user.Avatar = picture;
                    _userRepository.UpdateUser(user);
                }

                // Build roles/claims and issue tokens
                var roles = _roleRepository.GetRolesForUser(user.Id);
                var userClaims = _userRepository.GetClaimsForUser(user.Id);
                var roleNames = roles != null ? roles.Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList() : new List<string>();

                var accessResult = JwtUtils.CreateAccessToken(user, roleNames, _configuration);
                var accessToken = accessResult.Token;

                var jwtSection = _configuration.GetSection("JwtSettings");
                var accessTokenExpireMinutes = jwtSection.GetValue<int?>("ExpiresMinutes") ?? DEFAULT_EXPIRES_MINUTES;
                var refreshToken = JwtUtils.GenerateRefreshToken();
                var refreshExpireMinutes = jwtSection.GetValue<int?>("RefreshExpiresMinutes") ?? DEFAULT_REFRESH_EXPIRES_MINUTES;
                user.RefreshToken = refreshToken;
                user.RefreshTokenExpire = DateTime.UtcNow.AddMinutes(refreshExpireMinutes);
                _userRepository.UpdateUser(user);

                // build permissions
                List<string> permissions = new List<string>();
                if (roles != null)
                {
                    permissions = roles.SelectMany(r => r.AppPermissions ?? new List<AppPermission>())
                                        .Select(p => (p.Resource?.Name ?? p.ResourceId.ToString()) + ":" + (p.Action?.Name ?? p.ActionId.ToString()))
                                        .Distinct()
                                        .ToList();
                }

                List<short> subjectIds = new List<short>();
                if (userClaims != null)
                {
                    subjectIds = userClaims.Where(c => c.SubjectId > 0).Select(c => c.SubjectId).Distinct().ToList();
                }
                List<int> classIds = new List<int>();
                if (userClaims != null)
                {
                    classIds = userClaims.Where(c => c.ClassId > 0).Select(c => c.ClassId).Distinct().ToList();
                }

                return new LoginResult
                {
                    Tokens = new TokenPair
                    {
                        AccessToken = accessToken,
                        AccessTokenExpire = DateTime.UtcNow.AddMinutes(accessTokenExpireMinutes),
                        RefreshToken = refreshToken,
                        RefreshTokenExpire = user.RefreshTokenExpire ?? DateTime.UtcNow.AddMinutes(refreshExpireMinutes)
                    },
                    User = user,
                    Roles = roleNames,
                    Permissions = permissions,
                    SubjectIds = subjectIds,
                    ClassIds = classIds
                };
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Build Google OAuth2 authorization URL.
        /// </summary>
        public (string, string) BuildGoogleAuthUrl()
        {
            var google = _configuration.GetSection("Google");
            var clientId = google.GetValue<string>("ClientId");
            if (string.IsNullOrEmpty(clientId)) throw new InvalidOperationException("Google ClientId chưa được cấu hình!");

            var callbackPath = google.GetValue<string>("CallbackPath") ?? "/auth/google/callback";
            if (callbackPath.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
            {
                callbackPath = callbackPath.Substring(4); // cắt bỏ "/api"
            }
            else if (callbackPath.Contains("/api/", StringComparison.OrdinalIgnoreCase))
            {
                callbackPath = callbackPath.Replace("/api/", "/");
            }
            var redirectUri = new Uri(new Uri(_configuration["App:BaseUrl"] ?? "http://localhost:5173"), callbackPath).ToString();
            var scope = "openid email profile";
            var state = Guid.NewGuid().ToString("N");
            var authUrl = $"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={Uri.EscapeDataString(clientId)}&redirect_uri={Uri.EscapeDataString(redirectUri)}&scope={Uri.EscapeDataString(scope)}&state={state}&prompt=select_account";
            return (authUrl, state);
        }

        /// <summary>
        /// Validates a return URL (state) to prevent open redirects.
        /// Allows relative paths or absolute URLs that start with the configured App:BaseUrl.
        /// Returns the original returnUrl when safe, otherwise null.
        /// </summary>
        public string? ResolveReturnUrl(string? returnUrl)
        {
            if (string.IsNullOrEmpty(returnUrl)) return null;

            // allow relative urls (e.g. /dashboard)
            if (Uri.IsWellFormedUriString(returnUrl, UriKind.Relative)) return returnUrl;

            // allow absolute urls only if they start with App:BaseUrl
            var appBase = _configuration["App:BaseUrl"];
            if (string.IsNullOrEmpty(appBase)) return null;

            if (!Uri.IsWellFormedUriString(returnUrl, UriKind.Absolute)) return null;

            try
            {
                var baseUri = new Uri(appBase);
                var candidate = new Uri(returnUrl);
                if (candidate.AbsoluteUri.StartsWith(baseUri.AbsoluteUri, StringComparison.OrdinalIgnoreCase))
                {
                    return returnUrl;
                }
            }
            catch
            {
                // malformed URIs fall through to null
            }

            return null;
        }

        /// <summary>
        /// Handle Google callback: exchange code for tokens and perform login/signup.
        /// Returns LoginResult or null on failure.
        /// </summary>
        public LoginResult? HandleGoogleCallback(string code)
        {
            if (string.IsNullOrEmpty(code)) return null;
            var google = _configuration.GetSection("Google");
            var clientId = google.GetValue<string>("ClientId");
            var clientSecret = google.GetValue<string>("ClientSecret");
            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret)) return null;
            var callbackPath = google.GetValue<string>("CallbackPath") ?? "/auth/google/callback";
            var redirectUri = new Uri(new Uri(_configuration["App:BaseUrl"] ?? "http://localhost:5173"), callbackPath).ToString();

            try
            {
                using var http = new HttpClient();
                var tokenReq = new FormUrlEncodedContent(new[] {
                    new KeyValuePair<string,string>("code", code),
                    new KeyValuePair<string,string>("client_id", clientId),
                    new KeyValuePair<string,string>("client_secret", clientSecret),
                    new KeyValuePair<string,string>("redirect_uri", redirectUri),
                    new KeyValuePair<string,string>("grant_type", "authorization_code")
                });
                var tokenResp = http.PostAsync("https://oauth2.googleapis.com/token", tokenReq).Result;
                if (!tokenResp.IsSuccessStatusCode) return null;
                var tokenJson = tokenResp.Content.ReadAsStringAsync().Result;
                using var doc = JsonDocument.Parse(tokenJson);
                var root = doc.RootElement;
                if (!root.TryGetProperty("id_token", out var idt)) return null;
                var idToken = idt.GetString();
                if (string.IsNullOrEmpty(idToken)) return null;
                return LoginWithGoogle(idToken);
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Starts forgot password flow by generating a reset token and persisting it.
        /// Returns the reset token (caller should email it to user).
        /// </summary>
        public string? ForgotPassword(string email)
        {
            var user = _userRepository.GetByEmail(email);
            if (user == null) return null;

            var token = JwtUtils.CreateAccessToken(user, [], _configuration);
            var expire = DateTime.UtcNow.AddHours(1);
            _userRepository.UpdateResetToken(user.Id, token.Token, expire);
            return token.Token;
        }

        /// <summary>
        /// Resets password using a valid reset token.
        /// </summary>
        public bool ResetPassword(string resetToken, string newPassword)
        {
            if (string.IsNullOrEmpty(resetToken) || string.IsNullOrEmpty(newPassword)) return false;
            var user = _userRepository.GetByResetToken(resetToken);
            if (user == null) return false;
            if (!user.ResetPasswordExpire.HasValue || user.ResetPasswordExpire.Value < DateTime.UtcNow) return false;

            // Update password hash and clear reset token
            var hash = BCrypt.Net.BCrypt.HashPassword(newPassword, SALT_ROUNDS);
            user.PasswordHash = hash;
            user.ResetPasswordToken = null;
            user.ResetPasswordExpire = null;
            _userRepository.UpdateUser(user);
            return true;
        }
    }
}
