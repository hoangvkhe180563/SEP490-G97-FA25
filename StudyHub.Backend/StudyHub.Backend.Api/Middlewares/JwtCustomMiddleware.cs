using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.Text.Json;
using System.IdentityModel.Tokens.Jwt;

namespace StudyHub.Backend.Api.Middleware
{
    public class JwtCustomMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _configuration;

        public JwtCustomMiddleware(RequestDelegate next, IConfiguration configuration)
        {
            _next = next;
            _configuration = configuration;
        }

        public async Task Invoke(HttpContext context)
        {
            // Get token from cookie
            var token = context.Request.Cookies["access_token"];

            // If no token found, check Authorization header
            if (string.IsNullOrEmpty(token))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                var payload = new { success = false, message = "Access token is missing" };
                var json = JsonSerializer.Serialize(payload);
                await context.Response.WriteAsync(json);
                return;
            }

            try
            {
                context.Request.Headers["Authorization"] = $"Bearer {token}";
            }
            catch (SecurityTokenException ex)
            {
                // token was present but invalid -> reject request with JSON body
                Console.WriteLine("Token validation failed: " + ex.Message);
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                var payload = new { success = false, message = "Invalid or expired token" };
                var json = JsonSerializer.Serialize(payload);
                await context.Response.WriteAsync(json);
                return;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Unexpected error during token validation: " + ex.Message);
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/json";
                var payload = new { success = false, message = "An error occurred while processing the token" };
                var json = JsonSerializer.Serialize(payload);
                await context.Response.WriteAsync(json);
                return;
            }

            await _next(context);
        }
    }
}
