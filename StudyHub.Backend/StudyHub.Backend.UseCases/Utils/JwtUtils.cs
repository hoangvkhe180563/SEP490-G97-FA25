using System;
using System.Security.Cryptography;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Linq;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.UseCases.Utils
{
    public static class JwtUtils
    {

        private const int DEFAULT_EXPIRES_MINUTES = 60; // default 60 minutes

        // Generate a cryptographically strong refresh token (base64)
        public static string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        // Create an access token and optionally include multiple roles and permissions in claims.
        public static AccessTokenResult CreateAccessToken(AppUser user, IEnumerable<string> roles, IConfiguration configuration)
        {
            var jwtSection = configuration.GetSection("JwtSettings");
            var secret = jwtSection.GetValue<string>("Secret");
            var issuer = jwtSection.GetValue<string>("Issuer");
            var audience = jwtSection.GetValue<string>("Audience");
            var expiresMinutes = jwtSection.GetValue<int?>("ExpiresMinutes") ?? DEFAULT_EXPIRES_MINUTES;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.Name, user.Username ?? string.Empty),
            };

            // include role names
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var expires = DateTime.UtcNow.AddMinutes(expiresMinutes);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );

            var accessToken = new JwtSecurityTokenHandler().WriteToken(token);

            return new AccessTokenResult { Token = accessToken, Expires = expires };
        }

        // Deprecated: use CreateAccessToken with includePermissions=true instead.
        // Build claims from user and optional roles. If includePermissions=true and roles contain AppPermissions,
        // permissions will be serialized into a single JSON claim with type "perm".
        // Also includes class and subject ids from user claims.
        public static List<Claim> BuildClaims(AppUser user, IEnumerable<AppRole>? roles = null, IEnumerable<AppClaim>? userClaims = null, bool includePermissions = false)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.Name, user.Username ?? string.Empty),
                // include user's primary RoleId for compatibility
                new Claim("role_ids", roles != null ? string.Join(",", roles.Select(r => r.ToString())) : string.Empty)
            };
            // include role names (many roles) if provided
            if (roles != null)
            {
                var roleNames = roles.Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
                if (roleNames.Any())
                    claims.Add(new Claim("roles", JsonSerializer.Serialize(roleNames)));
            }

            // optional fields
            if (user.SchoolId.HasValue)
                claims.Add(new Claim("sch", user.SchoolId.Value.ToString()));

            if (user.CommuneId.HasValue && user.CommuneId.Value > 0)
                claims.Add(new Claim("com", user.CommuneId.Value.ToString()));

            // aggregate permissions across roles
            if (includePermissions && roles != null)
            {
                var permissions = new List<string>();
                foreach (var role in roles)
                {
                    if (role?.AppPolicies == null) continue;
                    foreach (var p in role.AppPolicies)
                    {
                        var res = p.Resource?.Name ?? p.ResourceId.ToString();
                        var act = p.ActionType;
                        permissions.Add($"{res}:{act}");
                    }
                }

                if (permissions.Any())
                    claims.Add(new Claim("perm", JsonSerializer.Serialize(permissions)));
            }

            // include class ids and subject ids from userClaims
            if (userClaims != null)
            {
                var classIds = userClaims.Where(c => c.ClassId > 0).Select(c => c.ClassId).Distinct().ToList();
                var subjectIds = userClaims.Where(c => c.SubjectId > 0).Select(c => c.SubjectId).Distinct().ToList();

                if (classIds.Any())
                    claims.Add(new Claim("class_ids", JsonSerializer.Serialize(classIds)));
                if (subjectIds.Any())
                    claims.Add(new Claim("subject_ids", JsonSerializer.Serialize(subjectIds)));
            }

            return claims;
        }

        // Provide TokenValidationParameters for authentication setup in Program.cs
        public static TokenValidationParameters GetTokenValidationParameters(IConfiguration configuration)
        {
            var jwtSection = configuration.GetSection("JwtSettings");
            var secret = jwtSection.GetValue<string>("Secret");
            var issuer = jwtSection.GetValue<string>("Issuer");
            var audience = jwtSection.GetValue<string>("Audience");

            return new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret!)),
                ValidateIssuer = !string.IsNullOrEmpty(issuer),
                ValidIssuer = issuer,
                ValidateAudience = !string.IsNullOrEmpty(audience),
                ValidAudience = audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        }

        // Create a short-lived verification token (signed JWT) that includes the user id and a purpose claim
        public static string CreateVerificationToken(Guid userId, IConfiguration configuration, int expiresHours = 24)
        {
            var jwtSection = configuration.GetSection("JwtSettings");
            var secret = jwtSection.GetValue<string>("Secret");
            var issuer = jwtSection.GetValue<string>("Issuer");
            var audience = jwtSection.GetValue<string>("Audience");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new Claim("purpose", "email_verification")
            };

            var expires = DateTime.UtcNow.AddHours(expiresHours);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // Validate a verification token and return the user id if valid; otherwise null
        public static Guid? ValidateVerificationToken(string token, IConfiguration configuration)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var tvp = GetTokenValidationParameters(configuration);
                var principal = handler.ValidateToken(token, tvp, out var validated);
                if (principal == null) return null;
                var purpose = principal.Claims.FirstOrDefault(c => c.Type == "purpose")?.Value;
                if (purpose != "email_verification") return null;
                var sub = principal.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value;
                if (string.IsNullOrEmpty(sub)) return null;
                if (Guid.TryParse(sub, out var userId)) return userId;
            }
            catch
            {
                // invalid token
                throw new UnauthorizedAccessException("Invalid or expired verification token");
            }
            return null;
        }
    }

}
