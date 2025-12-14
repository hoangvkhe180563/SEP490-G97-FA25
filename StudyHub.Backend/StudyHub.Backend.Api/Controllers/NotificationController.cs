using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.NotificationDTOS;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.UseCases.Services;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace StudyHub.Backend.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly NotificationService _notificationService;

        public NotificationController(NotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        private Guid GetCurrentUserIdOrThrow()
        {
            var claim = User.FindFirst("sub") ?? User.FindFirst("id") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null || !Guid.TryParse(claim.Value, out var uid))
                throw new UnauthorizedAccessException("Missing or invalid user id in token");
            return uid;
        }

        private static void ValidateTarget(NotificationCreateDto req)
        {
            var tt = req.TargetType?.Trim();
            if (string.Equals(tt, "All", StringComparison.OrdinalIgnoreCase))
            {
                if (req.TargetGroupId.HasValue || req.TargetRoleId.HasValue || req.TargetUserId.HasValue)
                    throw new ArgumentException("TargetType=All không được kèm TargetUserId/TargetGroupId/TargetRoleId");
            }
            else if (string.Equals(tt, "User", StringComparison.OrdinalIgnoreCase))
            {
                if (!req.TargetUserId.HasValue) throw new ArgumentException("TargetType=User cần TargetUserId");
            }
            else if (string.Equals(tt, "Group", StringComparison.OrdinalIgnoreCase))
            {
                if (!req.TargetGroupId.HasValue) throw new ArgumentException("TargetType=Group cần TargetGroupId");
            }
            else if (string.Equals(tt, "Role", StringComparison.OrdinalIgnoreCase))
            {
                if (!req.TargetRoleId.HasValue) throw new ArgumentException("TargetType=Role cần TargetRoleId");
            }
            else
            {
                throw new ArgumentException("TargetType không hợp lệ");
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateNotification([FromBody] NotificationCreateDto req, CancellationToken ct)
        {
            try
            {
                ValidateTarget(req);

                var createdBy = User?.Identity?.IsAuthenticated == true ? GetCurrentUserIdOrThrow() : Guid.Empty;
                var domain = NotificationMapper.ToDomain(req, createdBy);
                if (domain.ExpiresAt == null) domain.ExpiresAt = DateTime.UtcNow.AddDays(30);

                var saved = await _notificationService.SendNotificationAsync(domain, ct);
                return CreatedAtAction(nameof(GetById), new { id = saved.Id }, new NotificationResponseDto { Id = saved.Id });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message, title: "Create notification failed");
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById([FromRoute] Guid id, CancellationToken ct)
        {
            try
            {
                var n = await _notificationService.GetNotificationByIdAsync(id, ct);
                if (n == null) return NotFound();
                return Ok(NotificationMapper.ToDto(n, null));
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message, title: "Get notification failed");
            }
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyNotifications([FromQuery] bool includeRead = false, [FromQuery] int limit = 50, [FromQuery] int offset = 0, CancellationToken ct = default)
        {
            try
            {
                var userId = GetCurrentUserIdOrThrow();
                limit = Math.Clamp(limit, 1, 200);
                offset = Math.Max(0, offset);

                var list = await _notificationService.GetUserNotificationsAsync(userId, includeRead, limit, offset, ct);
                return Ok(list.ConvertAll(NotificationMapper.ToDto));
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message, title: "Get user notifications failed");
            }
        }

        [HttpGet("me/unread-count")]
        public async Task<IActionResult> GetUnreadCount(CancellationToken ct = default)
        {
            try
            {
                var userId = GetCurrentUserIdOrThrow();
                var count = await _notificationService.GetUnreadCountAsync(userId, ct);
                return Ok(new { Unread = count });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message, title: "Get unread count failed");
            }
        }

        [HttpPost("{id:guid}/mark-read")]
        public async Task<IActionResult> MarkAsRead([FromRoute] Guid id, CancellationToken ct)
        {
            try
            {
                var userId = GetCurrentUserIdOrThrow();
                await _notificationService.MarkAsReadAsync(id, userId, ct);
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message, title: "Mark as read failed");
            }
        }

        public class BulkMarkReadDto
        {
            public List<Guid> Ids { get; set; } = new();
        }

        [HttpPost("mark-read-bulk")]
        public async Task<IActionResult> MarkAsReadBulk([FromBody] BulkMarkReadDto req, CancellationToken ct)
        {
            try
            {
                var userId = GetCurrentUserIdOrThrow();
                await _notificationService.MarkAsReadBulkAsync(req?.Ids ?? new List<Guid>(), userId, ct);
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message, title: "Bulk mark as read failed");
            }
        }

        [HttpPost("groups")]
        public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequestDto req, CancellationToken ct)
        {
            try
            {
                var createdBy = req.CreatedBy == Guid.Empty && User?.Identity?.IsAuthenticated == true
                    ? GetCurrentUserIdOrThrow()
                    : req.CreatedBy;

                var group = new Domain.Entities.Notifications.NotificationGroup
                {
                    Name = req.Name,
                    Description = req.Description,
                    CreatedBy = createdBy,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _notificationService.CreateGroupAsync(group, ct);
                return CreatedAtAction(nameof(GetGroupById), new { id = created.Id }, created);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message, title: "Create group failed");
            }
        }

        [HttpGet("groups/{id:int}")]
        public async Task<IActionResult> GetGroupById([FromRoute] int id, CancellationToken ct)
        {
            try
            {
                var g = await _notificationService.GetGroupByIdAsync(id, ct);
                if (g == null) return NotFound();
                return Ok(g);
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message, title: "Get group failed");
            }
        }

        [HttpPost("groups/{groupId:int}/members")]
        public async Task<IActionResult> AddGroupMember([FromRoute] int groupId, [FromBody] AddGroupMemberRequestDto req, CancellationToken ct)
        {
            try
            {
                await _notificationService.AddUserToGroupAsync(groupId, req.UserId, ct);
                return NoContent();
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message, title: "Add group member failed");
            }
        }

        [HttpDelete("groups/{groupId:int}/members/{userId:guid}")]
        public async Task<IActionResult> RemoveGroupMember([FromRoute] int groupId, [FromRoute] Guid userId, CancellationToken ct)
        {
            try
            {
                await _notificationService.RemoveUserFromGroupAsync(groupId, userId, ct);
                return NoContent();
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message, title: "Remove group member failed");
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeactivateNotification([FromRoute] Guid id, CancellationToken ct)
        {
            try
            {
                await _notificationService.DeactivateNotificationAsync(id, ct);
                return NoContent();
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message, title: "Deactivate notification failed");
            }
        }
    }
}