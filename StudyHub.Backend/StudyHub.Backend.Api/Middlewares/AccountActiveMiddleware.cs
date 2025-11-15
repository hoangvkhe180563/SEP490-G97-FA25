using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace StudyHub.Backend.Api.Middlewares
{
    /// <summary>
    /// Middleware to block requests from authenticated users whose account has been marked inactive.
    /// If the user is authenticated and the DB user.Status == false, respond with the AccountInactive payload.
    /// </summary>
    public class AccountActiveMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IServiceScopeFactory _scopeFactory;

        public AccountActiveMiddleware(RequestDelegate next, IServiceScopeFactory scopeFactory)
        {
            _next = next;
            _scopeFactory = scopeFactory;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                // allow certain auth endpoints (logout, refresh-token) to bypass this middleware
                // so that users can still logout or refresh tokens even if marked inactive.
                var reqPath = context.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;
                if (reqPath.StartsWith("/api/auth/logout") || reqPath.StartsWith("/api/auth/refresh-token") || reqPath.StartsWith("/api/accountrecovery"))
                {
                    await _next(context);
                    return;
                }
                var user = context.User;
                if (user?.Identity?.IsAuthenticated == true)
                {
                    var idClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    if (!string.IsNullOrEmpty(idClaim) && Guid.TryParse(idClaim, out var userId))
                    {
                        // resolve scoped AppUserService per-request
                        using var scope = _scopeFactory.CreateScope();
                        var userService = scope.ServiceProvider.GetService<AppUserService>();
                        if (userService != null)
                        {
                            var appUser = userService.GetUserById(userId);
                            if (appUser != null && appUser.Status == false)
                            {
                                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                                context.Response.ContentType = "application/json";
                                var payload = System.Text.Json.JsonSerializer.Serialize(new
                                {
                                    success = false,
                                    error = "AccountInactive",
                                    message = "Tài khoản của bạn đang bị vô hiệu hóa."
                                });
                                await context.Response.WriteAsync(payload);
                                return;
                            }
                        }
                    }
                }
            }
            catch
            {
                // swallow errors here and let the pipeline continue; if DB check fails we don't want to block all requests
            }

            await _next(context);
        }
    }
}
