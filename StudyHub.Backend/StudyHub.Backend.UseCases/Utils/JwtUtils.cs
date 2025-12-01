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

            var expires = DateTime.Now.AddMinutes(expiresMinutes);

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

            var expires = DateTime.Now.AddHours(expiresHours);

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
