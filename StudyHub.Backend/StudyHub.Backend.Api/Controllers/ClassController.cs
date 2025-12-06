using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Dtos.ClassDTOS;
using StudyHub.Backend.Api.Dtos.ClassworkDTOS;
using StudyHub.Backend.Api.Hubs;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Services;
using System.Collections.Generic;
using System.Net;
using System.Security.Claims;
using System.Text.Json;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClassController : ControllerBase
    {
        private readonly ClassService _service;
        private readonly AppUserService _aUserService;
        private readonly ClassNotificationService _classNotificationService;
        private readonly IHubContext<NotificationHub> _notificationHub;

        public ClassController(
            ClassService service,
            AppUserService aUserService,
            ClassNotificationService classNotificationService,
            IHubContext<NotificationHub> notificationHub
        )
        {
            _service = service;
            _aUserService = aUserService;
            _classNotificationService = classNotificationService;
            _notificationHub = notificationHub;
        }

        [HttpGet]
        public IActionResult GetClasses(
            [FromQuery] string? query,
            [FromQuery] string? status,
            [FromQuery] Guid? memberid,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 10
        )
        {
            if (User.FindFirst(ClaimTypes.NameIdentifier) == null)
            {
                return Unauthorized(new { success = false, message = "Unauthorized" });
            }
            var userGuid = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var (classesEntities, totalItems, currentPage, pageLimit, totalPages) = _service.GetClassesPaged(query, status, userGuid, page, limit);

            var classListDtos = classesEntities
                .Select(c =>
                {
                    var teacher = _service.GetTeachers().FirstOrDefault(t => t.Id == c.CreatedBy);
                    return c.ToListClassDto(teacher);
                })
                .ToList();

            var response = new
            {
                success = true,
                message = "Danh sách lớp học được tải thành công.",
                classes = classListDtos,
                meta = new
                {
                    total = totalItems,
                    page = currentPage,
                    limit = pageLimit,
                    totalPages = totalPages
                }
            };

            return Ok(response);
        }

        [HttpPost]
        public async Task<IActionResult> CreateClass([FromBody] CreateClassDto dto)
        {
            if (User.FindFirst(ClaimTypes.NameIdentifier) == null)
            {
                return Unauthorized(new { success = false, message = "Unauthorized" });
            }
            var userGuid = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { success = false, message = "Tên lớp học không được để trống." });

            var entity = dto.ToEntity();
            entity.Grade = dto.Grade;
            entity.CreatedBy = userGuid;

            var createdClass = _service.CreateClass(entity);

            // Gửi thông báo & broadcast SignalR
            try
            {
                var notifData = await _service.PrepareNotificationsAsync(createdClass, userGuid, isCreate: true);
                if (notifData != null)
                {
                    var (groupId, maintainerIds, groupNotif, actorNotif) = notifData.Value;

                    var groupTargets = maintainerIds.Select(id => $"user_{id}").ToList();
                    groupTargets.Add($"group_{groupId}");

                    var payloadGroup = new
                    {
                        id = groupNotif.Id,
                        title = groupNotif.Title,
                        body = groupNotif.Body,
                        priority = groupNotif.Priority,
                        targetType = groupNotif.TargetType,
                        targetGroupId = groupNotif.TargetGroupId,
                        createdAt = groupNotif.CreatedAt
                    };
                    await _notificationHub.Clients.Groups(groupTargets).SendAsync("NotificationCreated", payloadGroup);

                    var payloadActor = new
                    {
                        id = actorNotif.Id,
                        title = actorNotif.Title,
                        body = actorNotif.Body,
                        priority = actorNotif.Priority,
                        targetType = actorNotif.TargetType,
                        targetUserId = actorNotif.TargetUserId,
                        createdAt = actorNotif.CreatedAt
                    };
                    await _notificationHub.Clients.Group($"user_{userGuid}").SendAsync("NotificationCreated", payloadActor);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Notification broadcast error: {ex.Message}");
            }

            return CreatedAtAction(nameof(GetClasses), new { id = createdClass.Id }, createdClass.ToDetailDto());
        }

        [HttpGet("subject")]
        public IActionResult GetSubject()
        {
            return Ok(_service.GetSubjects());
        }

        [HttpGet("get-all-homeroomteacher")]
        public IActionResult GetAllHomeroomTeacher()
        {
            if (User.FindFirst(ClaimTypes.NameIdentifier) == null)
            {
                return Unauthorized(new { success = false, message = "Unauthorized" });
            }
            var userGuid = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            return Ok(_service.GetTeachersHomeRoom(userGuid));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] EditClassDto dto)
        {
            if (User.FindFirst(ClaimTypes.NameIdentifier) == null)
            {
                return Unauthorized(new { success = false, message = "Unauthorized" });
            }
            var userGuid = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var updated = _service.UpdateClassFromPrimitives(id, dto.Name, dto.Description, userGuid, dto.CreateBy);
            if (updated == null) return NotFound();

            // Gửi thông báo & broadcast SignalR
            try
            {
                var notifData = await _service.PrepareNotificationsAsync(updated, userGuid, isCreate: false);
                if (notifData != null)
                {
                    var (groupId, maintainerIds, groupNotif, actorNotif) = notifData.Value;

                    var groupTargets = maintainerIds.Select(id => $"user_{id}").ToList();
                    groupTargets.Add($"group_{groupId}");

                    var payloadGroup = new
                    {
                        id = groupNotif.Id,
                        title = groupNotif.Title,
                        body = groupNotif.Body,
                        priority = groupNotif.Priority,
                        targetType = groupNotif.TargetType,
                        targetGroupId = groupNotif.TargetGroupId,
                        createdAt = groupNotif.CreatedAt
                    };
                    await _notificationHub.Clients.Groups(groupTargets).SendAsync("NotificationCreated", payloadGroup);

                    var payloadActor = new
                    {
                        id = actorNotif.Id,
                        title = actorNotif.Title,
                        body = actorNotif.Body,
                        priority = actorNotif.Priority,
                        targetType = actorNotif.TargetType,
                        targetUserId = actorNotif.TargetUserId,
                        createdAt = actorNotif.CreatedAt
                    };
                    await _notificationHub.Clients.Group($"user_{userGuid}").SendAsync("NotificationCreated", payloadActor);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Notification broadcast error: {ex.Message}");
            }

            return Ok(updated.ToDetailDto());
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            if (User.FindFirst(ClaimTypes.NameIdentifier) == null)
            {
                return Unauthorized(new { success = false, message = "Unauthorized" });
            }

            var userGuid = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var deleted = _service.DeleteClass(id, userGuid);
            if (deleted == null)
            {
                return NotFound(new { success = false, message = "Class not found" });
            }

            return Ok(new { success = true, message = "Xóa lớp thành công (soft delete)", data = deleted.ToDetailDto() });
        }

        [HttpGet("{id}/detail")]
        public IActionResult GetClassDetail(int id)
        {
            var cls = _service.GetClassById(id);
            if (cls == null)
                return NotFound(new { success = false, message = "Không tìm thấy lớp học." });

            var notificationsEntities = _classNotificationService.GetNotifications(id);

            var notifications = notificationsEntities
                .Select(n =>
                {
                    var files = _classNotificationService.GetFilesByNotification(n.Id);
                    var comments = _classNotificationService.GetCommentsByNotificationId(n.Id);

                    return n.ToNotificationDto(
                        _aUserService.GetUserById(n.CreatedBy),
                        files.Select(f => f.ToFileDto()).ToList(),
                        comments.Select(c => c.ToCommentDto(_aUserService.GetUserById(c.CreatedBy))).ToList()
                    );
                })
                .ToList();

            var dto = cls.ToFullDetailDto(notifications);

            return Ok(new
            {
                success = true,
                message = "Lấy thông tin lớp học thành công.",
                data = dto
            });
        }
    }
}