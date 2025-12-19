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
using StudyHub.Backend.UseCases.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClassController : ControllerBase
    {
        private readonly ClassService _service;
        private readonly AppUserService _aUserService;
        private readonly ClassNotificationService _classNotificationService;
        private readonly NotificationService _notificationService;
        private readonly IHubContext<NotificationHub> _notificationHub;

        public ClassController(
            ClassService service,
            AppUserService aUserService,
            ClassNotificationService classNotificationService,
            NotificationService notificationService,
            IHubContext<NotificationHub> notificationHub
        )
        {
            _service = service;
            _aUserService = aUserService;
            _classNotificationService = classNotificationService;
            _notificationService = notificationService;
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

            

            // prepare actor/class info
            var actor = _aUserService.GetUserById(userGuid);
            string updaterLink = "/class";
          
            var actorName = actor?.Fullname ?? "Người dùng";
            var className = createdClass?.Name ?? $"lớp {createdClass.Id}";

            // ---------------------------
            try
            {
                if (actor?.SchoolId != null)
                {
                    // ensure maintainer group exists and get member ids
                    var (maintainerGroupId, maintainerIds) = await _notificationService.EnsureCompositeGroupAsync(
                        schoolId: actor.SchoolId.Value,
                        roleNames: new[] { "School Admin", "Homeroom Teacher" },
                        createdBy: userGuid,
                        ct: HttpContext.RequestAborted
                    );

                    if (maintainerIds != null && maintainerIds.Any())
                    {
                        // Create + persist notification and seed per-user unread entries
                        var savedMaint = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                            title: $"Lớp {className} được tạo bởi {actorName}",
                            body: $"{actorName} đã tạo lớp {className}",
                            targetType: "Group",
                            targetGroupId: maintainerGroupId,
                            targetUserId: null,
                            recipientUserIds: maintainerIds, // seed per-user so offline users have unread
                            createdBy: userGuid,
                            linkUrl: updaterLink,
                            priority: "High",
                            ct: HttpContext.RequestAborted);

                        // Build minimal payload
                        var payload = new
                        {
                            id = savedMaint.Id,
                            title = savedMaint.Title,
                            body = savedMaint.Body,
                            linkUrl = updaterLink,
                            priority = savedMaint.Priority,
                            targetType = savedMaint.TargetType,
                            targetGroupId = savedMaint.TargetGroupId,
                            createdAt = savedMaint.CreatedAt
                        };

                        // 1) Reliable immediate delivery: broadcast to each maintainer's user_{id} groups
                        try
                        {
                            var userTargets = maintainerIds.Select(id => $"user_{id}").ToArray();
                            await _notificationHub.Clients.Groups(userTargets).SendAsync("NotificationCreated", payload);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Broadcast to maintainer user groups failed: {ex}");
                        }

                        // 2) Optional: ask clients to join the persistent group so future group broadcasts work
                        try
                        {
                            var userTargets = maintainerIds.Select(id => $"user_{id}").ToArray();
                            await _notificationHub.Clients.Groups(userTargets).SendAsync("RequestJoinGroup", new { groupId = maintainerGroupId });
                        }
                        catch
                        {
                            // non-fatal
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Create/send maintainer notifications error: {ex}");
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

            
            // prepare actor/class info
            var actor = _aUserService.GetUserById(userGuid);
            string updaterLink = "/class";


            var actorName = actor?.Fullname ?? "Người dùng";
            var className = updated?.Name ?? $"lớp {updated.Id}";

            // ---------------------------
            try
            {
                if (actor?.SchoolId != null)
                {
                    // ensure maintainer group exists and get member ids
                    var (maintainerGroupId, maintainerIds) = await _notificationService.EnsureCompositeGroupAsync(
                        schoolId: actor.SchoolId.Value,
                        roleNames: new[] { "School Admin", "Homeroom Teacher" },
                        createdBy: userGuid,
                        ct: HttpContext.RequestAborted
                    );

                    if (maintainerIds != null && maintainerIds.Any())
                    {
                        // Create + persist notification and seed per-user unread entries
                        var savedMaint = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                            title: $"Lớp {className} được cập nhật bởi {actorName}",
                            body: $"{actorName} đã cập nhật lớp {className}",
                            targetType: "Group",
                            targetGroupId: maintainerGroupId,
                            targetUserId: null,
                            recipientUserIds: maintainerIds, // seed per-user so offline users have unread
                            createdBy: userGuid,
                            linkUrl: updaterLink,
                            priority: "High",
                            ct: HttpContext.RequestAborted);

                        // Build minimal payload
                        var payload = new
                        {
                            id = savedMaint.Id,
                            title = savedMaint.Title,
                            body = savedMaint.Body,
                            linkUrl = updaterLink,
                            priority = savedMaint.Priority,
                            targetType = savedMaint.TargetType,
                            targetGroupId = savedMaint.TargetGroupId,
                            createdAt = savedMaint.CreatedAt
                        };

                        // 1) Reliable immediate delivery: broadcast to each maintainer's user_{id} groups
                        try
                        {
                            var userTargets = maintainerIds.Select(id => $"user_{id}").ToArray();
                            await _notificationHub.Clients.Groups(userTargets).SendAsync("NotificationCreated", payload);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Broadcast to maintainer user groups failed: {ex}");
                        }

                        // 2) Optional: ask clients to join the persistent group so future group broadcasts work
                        try
                        {
                            var userTargets = maintainerIds.Select(id => $"user_{id}").ToArray();
                            await _notificationHub.Clients.Groups(userTargets).SendAsync("RequestJoinGroup", new { groupId = maintainerGroupId });
                        }
                        catch
                        {
                            // non-fatal
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Create/send maintainer notifications error: {ex}");
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