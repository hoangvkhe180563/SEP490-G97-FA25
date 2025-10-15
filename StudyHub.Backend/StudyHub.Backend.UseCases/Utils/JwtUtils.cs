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

namespace StudyHub.Backend.UseCases.Utils
{
    public static class JwtUtils
    {
        // Generate a cryptographically strong refresh token (base64)
        public static string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        // Create an access token and optionally include multiple roles and permissions in claims.
        public static AccessTokenResult CreateAccessToken(AppUser user, IEnumerable<AppRole>? roles, IEnumerable<AppClaim>? userClaims, IConfiguration configuration, bool includePermissions = false)
        {
            var jwtSection = configuration.GetSection("JwtSettings");
            var secret = jwtSection.GetValue<string>("Secret");
            var issuer = jwtSection.GetValue<string>("Issuer");
            var audience = jwtSection.GetValue<string>("Audience");
            var expiresMinutes = jwtSection.GetValue<int?>("ExpiresMinutes") ?? 60;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.Name, user.Username ?? string.Empty),
                // include user's primary RoleId for compatibility
                new Claim("role_id", roles?.First().Id.ToString() ?? string.Empty)
            };

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

            if (user.CommuneId > 0)
                claims.Add(new Claim("com", user.CommuneId.ToString()));

            // aggregate permissions across roles
            if (includePermissions && roles != null)
            {
                var permissions = new List<string>();
                foreach (var role in roles)
                {
                    if (role?.AppPermissions == null) continue;
                    foreach (var p in role.AppPermissions)
                    {
                        var res = p.Resource?.Name ?? p.ResourceId.ToString();
                        var act = p.Action?.Name ?? p.ActionId.ToString();
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
    }

    // Result returned when creating an access token
    public class AccessTokenResult
    {
        public string Token { get; set; } = string.Empty;
        public DateTime Expires { get; set; }
    }

    // Simple token pair DTO returned from the use-case layer
    public class TokenPair
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime RefreshTokenExpire { get; set; }
    }
}
