using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Utils;
using System;
using Microsoft.AspNetCore.Http.HttpResults;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AppUserController : ControllerBase
    {
        private readonly AppUserService _userService;
        private readonly IConfiguration _configuration;

        public AppUserController(AppUserService userService, IConfiguration configuration)
        {
            _userService = userService;
            _configuration = configuration;
        }

        [HttpGet]
        public IActionResult Get([FromQuery] string? status, [FromQuery] string? role, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            var result = _userService.GetAppUsers(status, role, search, page, limit);
            var response = new
            {
                success = true,
                users = result.Items,
                meta = new
                {
                    total = result.Total,
                    page = result.Page,
                    limit = result.Limit,
                    totalPages = result.TotalPages
                }
            };
            return Ok(response);
        }

        // Admin: get account detail
        [HttpGet("{id}")]
        public IActionResult GetById(Guid id)
        {
            var user = _userService.GetUserById(id);
            if (user == null) return NotFound();
            var response = new
            {
                success = true,
                user,
            };
            return Ok(response);
        }

        // Admin: create account
        [HttpPost("create")]
        public IActionResult Create([FromBody] CreateAccountRequest req)
        {
            try
            {
                var user = _userService.CreateAccount(req.Email, req.Password, req.Username, req.RoleId, req.CommuneId, req.Fullname);
                return Ok(user);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Admin: edit account
        [HttpPut("{id}")]
        public IActionResult Edit(Guid id, [FromBody] EditAccountRequest req)
        {
            var user = _userService.EditAccount(id, req.Email, req.Username, req.Fullname, req.RoleId, req.CommuneId, req.Status);
            if (user == null) return NotFound();
            return Ok(user);
        }

        // Admin: deactivate account (set status to false)
        [HttpPatch("{id}/deactivate")]
        public IActionResult Deactivate(Guid id)
        {
            var ok = _userService.DeactivateAccount(id);
            if (!ok) return NotFound();
            return Ok(new { message = "Account deactivated" });
        }

        [HttpPost("signup")]
        public IActionResult Signup([FromBody] SignupRequest req)
        {
            var user = _userService.Signup(req.Email, req.Password, req.Username, req.CommuneId, req.Fullname);
            if (user == null)
            {
                return BadRequest(new SignupResponse { Success = false, Message = "Người dùng đã tồn tại" });
            }
            return Ok(new SignupResponse { Success = true, Message = "Đăng kí thành công", Data = user });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            var result = _userService.Login(req.Email, req.Password);
            if (result == null) return Unauthorized(new LoginResponse { Success = false, Message = "Thông tin đăng nhập không hợp lệ" });

            var tokens = result.Tokens;

            // Cookie options for access token (short-lived)
            var jwtSection = _configuration.GetSection("JwtSettings");
            var accessExpiresMinutes = jwtSection.GetValue<int?>("ExpiresMinutes") ?? 60;

            var accessCookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddMinutes(accessExpiresMinutes)
            };

            // Cookie options for refresh token (longer-lived)
            var refreshCookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = tokens.RefreshTokenExpire.ToUniversalTime()
            };

            Response.Cookies.Append("access_token", tokens.AccessToken, accessCookieOptions);
            Response.Cookies.Append("refresh_token", tokens.RefreshToken, refreshCookieOptions);

            // Build user info response (do not return tokens in body)
            var userInfo = new UserInfoResponse
            {
                Id = result.User.Id,
                Email = result.User.Email,
                Username = result.User.Username,
                Roles = result.Roles?.Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList() ?? new List<string>(),
                Permissions = (result.Roles != null) ? result.Roles.SelectMany(r => r.AppPermissions ?? new List<AppPermission>()).Select(p => (p.Resource?.Name ?? p.ResourceId.ToString()) + ":" + (p.Action?.Name ?? p.ActionId.ToString())).Distinct().ToList() : new List<string>(),
                ClassIds = result.Claims?.Where(c => c.ClassId > 0).Select(c => c.ClassId).Distinct().ToList() ?? new List<int>(),
                SubjectIds = result.Claims?.Where(c => c.SubjectId > 0).Select(c => c.SubjectId).Distinct().ToList() ?? new List<short>()
            };

            return Ok(new GenericResponse { Success = true, Message = "Đăng nhập thành công", Data = userInfo });
        }

        [HttpPost("logout")]
        public IActionResult Logout([FromBody] Guid userId)
        {
            // server-side: clear refresh token stored for the user
            _userService.Logout(userId);

            // clear cookies on client
            Response.Cookies.Delete("access_token");
            Response.Cookies.Delete("refresh_token");

            return Ok();
        }
    }
}
