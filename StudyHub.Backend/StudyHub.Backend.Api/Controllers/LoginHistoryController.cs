using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.UseCases.Services;
using System.Security.Claims;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class LoginHistoryController : ControllerBase
    {
        private readonly AppUserLoginHistoryService _historyService;

        public LoginHistoryController(AppUserLoginHistoryService historyService)
        {
            _historyService = historyService;
        }

        // GET api/loginhistory?userId={userId}&page=1&limit=20
            [HttpGet]
            public IActionResult Get([FromQuery] string? userId, [FromQuery] int page = 1, [FromQuery] int limit = 20,
                                     [FromQuery] string? sortBy = null, [FromQuery] bool sortDesc = true, [FromQuery] bool? isActive = null)
        {
            Guid targetUser;
            // determine current user id
            var currentUserIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserIdClaim) || !Guid.TryParse(currentUserIdClaim, out var currentUserId))
            {
                return Unauthorized(new { success = false, message = "User not authenticated" });
            }

            if (string.IsNullOrEmpty(userId))
            {
                targetUser = currentUserId;
            }
            else
            {
                if (!Guid.TryParse(userId, out var parsed)) return BadRequest(new { success = false, message = "Invalid userId" });
                // if requesting someone else's history, require admin role
                var isAdmin = User.IsInRole("Admin") || User.IsInRole("Administrator");
                if (parsed != currentUserId && !isAdmin) return Forbid();
                targetUser = parsed;
            }

                var (items, total) = _historyService.GetHistory(targetUser, page, limit, sortBy, sortDesc, isActive);
                // Note: service currently forwards to repository which supports sort/filter via overload. If service is extended, pass sort/filter there.

            var dto = items.Select(i => new LoginHistoryDto
            {
                Id = i.Id,
                SessionId = i.SessionId ?? Guid.Empty,
                LoginAt = i.LoginAt,
                LogoutAt = i.LogoutAt,
                IsSuccess = i.IsSuccess,
                IsActiveSession = i.IsActiveSession,
                LastSeen = i.LastSeen
            }).ToList();

                var totalPages = (int)Math.Ceiling(total / (double)limit);
                return Ok(new { success = true, data = dto, total, totalPages, page, limit, sortBy, sortDesc, isActive });
        }
    }
}
