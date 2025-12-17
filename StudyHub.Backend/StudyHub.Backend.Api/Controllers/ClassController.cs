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
using System;
using System.Linq;
using System.Threading.Tasks;

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
        private string BuildClassLinkForUser(Guid userId, int classId)
        {
            var roleSegment = "student";
            var isManager = false;

            try
            {
                var user = _aUserService.GetUserById(userId);
                if (user != null)
                {
                    // 1) Nếu có collection Roles (các object hoặc string)
                    var rolesProp = user.GetType().GetProperty("Roles");
                    if (rolesProp != null)
                    {
                        var rolesVal = rolesProp.GetValue(user) as System.Collections.IEnumerable;
                        if (rolesVal != null)
                        {
                            foreach (var r in rolesVal)
                            {
                                if (r == null) continue;

                                // Tries several ways to obtain role name:
                                string? nameVal = null;

                                // If element is a string
                                if (r is string s) nameVal = s;
                                else
                                {
                                    // Try property "Name", "Role", "RoleName"
                                    var rp = r.GetType().GetProperty("Name") ?? r.GetType().GetProperty("Role") ?? r.GetType().GetProperty("RoleName");
                                    if (rp != null)
                                        nameVal = rp.GetValue(r) as string;
                                }

                                if (string.IsNullOrWhiteSpace(nameVal)) continue;

                                var n = nameVal.Trim();

                                // School admin has highest priority (case-insensitive)
                                if (n.IndexOf("School Admin", StringComparison.OrdinalIgnoreCase) >= 0)
                                {
                                    isManager = true;
                                    break;
                                }

                                // If role contains "teacher" (case-insensitive) set roleSegment to teacher
                                if (n.IndexOf("teacher", StringComparison.OrdinalIgnoreCase) >= 0)
                                {
                                    roleSegment = "teacher";
                                    // continue checking in case a School Admin role appears later
                                }
                            }
                        }
                    }
                    else
                    {
                        // 2) Fallback: check single property Role or RoleName (string)
                        var roleNameProp = user.GetType().GetProperty("Role") ?? user.GetType().GetProperty("RoleName");
                        if (roleNameProp != null)
                        {
                            var rn = roleNameProp.GetValue(user) as string;
                            if (!string.IsNullOrWhiteSpace(rn))
                            {
                                var rv = rn.Trim();
                                if (rv.IndexOf("School Admin", StringComparison.OrdinalIgnoreCase) >= 0)
                                {
                                    isManager = true;
                                }
                                else if (rv.IndexOf("teacher", StringComparison.OrdinalIgnoreCase) >= 0)
                                {
                                    roleSegment = "teacher";
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                // optional: log for debugging, remove in production if needed
                Console.WriteLine($"BuildClassLinkForUser failed to detect role for user {userId}: {ex.Message}");
            }

            if (isManager)
            {
                return "/class/manager/management-classes";
            }

            return $"/class/{roleSegment}/{classId}";
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

            // Prepare linkUrl for this creator (used in notification payload)
            var creatorLink = BuildClassLinkForUser(userGuid, createdClass.Id);

            // prepare actor/class info
            var actor = _aUserService.GetUserById(userGuid);
            var actorName = actor?.Fullname ?? "Người dùng";
            var className = createdClass?.Name ?? $"lớp {createdClass.Id}";

            // 1) Maintainer notifications: send group notification to maintainers; if actor NOT in maintainer group, send personal notification to actor.
            try
            {
                if (actor?.SchoolId != null)
                {
                    // get maintainers (IDs)
                    var maintainerIds = _notificationService.GetMaintainersForSchool(actor.SchoolId.Value).ToList();

                    if (maintainerIds.Any())
                    {
                        var maintTitle = $"Lớp {className} được tạo bởi {actorName}";
                        var maintBody = $"{actorName} đã tạo lớp {className}";

                        var savedMaint = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                            title: maintTitle,
                            body: maintBody,
                            targetType: "Group",
                            targetGroupId: null,
                            targetUserId: null,
                            recipientUserIds: maintainerIds,
                            createdBy: userGuid,
                            linkUrl: creatorLink,
                            priority: "High",
                            ct: HttpContext.RequestAborted);

                        // broadcast maintainer group notification
                        try
                        {
                            var groupTargets = maintainerIds.Select(id => $"user_{id}").ToList();
                            // We don't have a specific notification_group id here, but client group targets by user_{id} will receive it.
                            string? savedLink = null;
                            if (!string.IsNullOrWhiteSpace(savedMaint?.Metadata))
                            {
                                try
                                {
                                    using var doc = JsonDocument.Parse(savedMaint.Metadata);
                                    if (doc.RootElement.TryGetProperty("linkUrl", out var p) && p.ValueKind == JsonValueKind.String)
                                        savedLink = p.GetString();
                                }
                                catch { }
                            }

                            var payload = new
                            {
                                id = savedMaint.Id,
                                title = savedMaint.Title,
                                body = savedMaint.Body,
                                linkUrl = savedLink ?? creatorLink,
                                priority = savedMaint.Priority,
                                targetType = savedMaint.TargetType,
                                targetGroupId = savedMaint.TargetGroupId,
                                createdAt = savedMaint.CreatedAt
                            };

                            await _notificationHub.Clients.Groups(groupTargets).SendAsync("NotificationCreated", payload);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Broadcast maintainer group notification failed: {ex}");
                        }
                    }

                    // send personal notification to actor only if actor is NOT in maintainer list
                    var isActorMaintainer = maintainerIds.Contains(userGuid);
                    if (!isActorMaintainer)
                    {
                        try
                        {
                            var actorTitle = $"Bạn đã tạo lớp {className}";
                            var actorBody = $"Lớp {className} đã được tạo";

                            var savedActorNotif = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                                title: actorTitle,
                                body: actorBody,
                                targetType: "User",
                                targetGroupId: null,
                                targetUserId: userGuid,
                                recipientUserIds: new[] { userGuid },
                                createdBy: userGuid,
                                linkUrl: creatorLink,
                                priority: "Normal",
                                ct: HttpContext.RequestAborted);

                            // broadcast personal actor notification
                            try
                            {
                                string? actorLink = null;
                                if (!string.IsNullOrWhiteSpace(savedActorNotif?.Metadata))
                                {
                                    try
                                    {
                                        using var doc = JsonDocument.Parse(savedActorNotif.Metadata);
                                        if (doc.RootElement.TryGetProperty("linkUrl", out var p) && p.ValueKind == JsonValueKind.String)
                                            actorLink = p.GetString();
                                    }
                                    catch { }
                                }

                                var payloadActor = new
                                {
                                    id = savedActorNotif.Id,
                                    title = savedActorNotif.Title,
                                    body = savedActorNotif.Body,
                                    linkUrl = actorLink ?? creatorLink,
                                    priority = savedActorNotif.Priority,
                                    targetType = savedActorNotif.TargetType,
                                    targetUserId = savedActorNotif.TargetUserId,
                                    createdAt = savedActorNotif.CreatedAt
                                };
                                await _notificationHub.Clients.Group($"user_{userGuid}").SendAsync("NotificationCreated", payloadActor);
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Broadcast actor personal notification failed: {ex}");
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Create actor personal notification failed: {ex}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Create/send maintainer notifications error: {ex}");
            }

            // 2) Class-members notification: include class name in title/body; controller will avoid sending personal duplicate because we only create group notification here.
            try
            {
                var displayTitle = $"{actorName} đã tạo lớp {className}";
                var displayBody = createdClass.Name;

                var memberIds = _classNotificationService.GetMemberIdsByClass(createdClass.Id) ?? new List<Guid>();

                var savedClassNotif = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                    title: displayTitle,
                    body: displayBody,
                    targetType: "Group",
                    targetGroupId: createdClass.Id,
                    targetUserId: null,
                    recipientUserIds: memberIds,
                    createdBy: userGuid,
                    linkUrl: creatorLink,
                    priority: "Normal",
                    ct: HttpContext.RequestAborted);

                // broadcast to class members
                try
                {
                    string? savedLink = null;
                    if (!string.IsNullOrWhiteSpace(savedClassNotif?.Metadata))
                    {
                        try
                        {
                            using var doc = JsonDocument.Parse(savedClassNotif.Metadata);
                            if (doc.RootElement.TryGetProperty("linkUrl", out var p) && p.ValueKind == JsonValueKind.String)
                                savedLink = p.GetString();
                        }
                        catch { }
                    }

                    var targets = memberIds.Select(id => $"user_{id}").ToList();
                    targets.Add($"group_{createdClass.Id}");

                    var payload = new
                    {
                        id = savedClassNotif.Id,
                        title = savedClassNotif.Title,
                        body = savedClassNotif.Body,
                        linkUrl = savedLink ?? creatorLink,
                        priority = savedClassNotif.Priority,
                        targetType = savedClassNotif.TargetType,
                        targetGroupId = savedClassNotif.TargetGroupId,
                        createdAt = savedClassNotif.CreatedAt,
                        createdBy = savedClassNotif.CreatedBy,
                        isRead = false
                    };

                    await _notificationHub.Clients.Groups(targets).SendAsync("NotificationCreated", payload);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Broadcast class-members notification failed: {ex}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Create/persist class-members notification error: {ex}");
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

            // Prepare linkUrl for this updater (based on user's role)
            var updaterLink = BuildClassLinkForUser(userGuid, updated.Id);

            // prepare actor/class info
            var actor = _aUserService.GetUserById(userGuid);
            var actorName = actor?.Fullname ?? "Người dùng";
            var className = updated?.Name ?? $"lớp {updated.Id}";

            // 1) Maintainer notifications: send group notification to maintainers; if actor NOT in maintainer group, send personal notification to actor.
            try
            {
                if (actor?.SchoolId != null)
                {
                    var maintainerIds = _notificationService.GetMaintainersForSchool(actor.SchoolId.Value).ToList();

                    if (maintainerIds.Any())
                    {
                        var maintTitle = $"Lớp {className} được cập nhật bởi {actorName}";
                        var maintBody = $"{actorName} đã cập nhật lớp {className}";

                        var savedMaint = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                            title: maintTitle,
                            body: maintBody,
                            targetType: "Group",

                            targetGroupId: null,
                            targetUserId: null,
                            recipientUserIds: maintainerIds,
                            createdBy: userGuid,
                            linkUrl: updaterLink,
                            priority: "High",
                            ct: HttpContext.RequestAborted);

                        // broadcast maintainer notification
                        try
                        {
                            var groupTargets = maintainerIds.Select(i => $"user_{i}").ToList();
                            string? savedLink = null;
                            if (!string.IsNullOrWhiteSpace(savedMaint?.Metadata))
                            {
                                try
                                {
                                    using var doc = JsonDocument.Parse(savedMaint.Metadata);
                                    if (doc.RootElement.TryGetProperty("linkUrl", out var p) && p.ValueKind == JsonValueKind.String)
                                        savedLink = p.GetString();
                                }
                                catch { }
                            }

                            var payload = new
                            {
                                id = savedMaint.Id,
                                title = savedMaint.Title,
                                body = savedMaint.Body,
                                linkUrl = savedLink ?? updaterLink,
                                priority = savedMaint.Priority,
                                targetType = savedMaint.TargetType,
                                targetGroupId = savedMaint.TargetGroupId,
                                createdAt = savedMaint.CreatedAt
                            };

                            await _notificationHub.Clients.Groups(groupTargets).SendAsync("NotificationCreated", payload);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Broadcast maintainer notification failed: {ex}");
                        }
                    }

                    // actor personal notification only if not in maintainer list
                    var isActorMaintainer = maintainerIds.Contains(userGuid);
                    if (!isActorMaintainer)
                    {
                        try
                        {
                            var actorTitle = $"Bạn đã cập nhật lớp {className}";
                            var actorBody = $"Lớp {className} đã được cập nhật";

                            var savedActorNotif = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                                title: actorTitle,
                                body: actorBody,
                                targetType: "User",
                                targetGroupId: null,
                                targetUserId: userGuid,
                                recipientUserIds: new[] { userGuid },
                                createdBy: userGuid,
                                linkUrl: updaterLink,
                                priority: "Normal",
                                ct: HttpContext.RequestAborted);

                            try
                            {
                                string? actorLink = null;
                                if (!string.IsNullOrWhiteSpace(savedActorNotif?.Metadata))
                                {
                                    try
                                    {
                                        using var doc = JsonDocument.Parse(savedActorNotif.Metadata);
                                        if (doc.RootElement.TryGetProperty("linkUrl", out var p) && p.ValueKind == JsonValueKind.String)
                                            actorLink = p.GetString();
                                    }
                                    catch { }
                                }

                                var payloadActor = new
                                {
                                    id = savedActorNotif.Id,
                                    title = savedActorNotif.Title,
                                    body = savedActorNotif.Body,
                                    linkUrl = actorLink ?? updaterLink,
                                    priority = savedActorNotif.Priority,
                                    targetType = savedActorNotif.TargetType,
                                    targetUserId = savedActorNotif.TargetUserId,
                                    createdAt = savedActorNotif.CreatedAt
                                };
                                await _notificationHub.Clients.Group($"user_{userGuid}").SendAsync("NotificationCreated", payloadActor);
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Broadcast actor personal notification failed: {ex}");
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Create actor personal notification failed: {ex}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Create/send maintainer notifications error: {ex}");
            }

            // 2) Class-members notification for update: include class name in title/body
            try
            {
                var displayTitle = $"{actorName} đã cập nhật lớp {className}";
                var displayBody = updated.Name;

                var memberIds = _classNotificationService.GetMemberIdsByClass(updated.Id) ?? new List<Guid>();

                var savedClassNotif = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                    title: displayTitle,
                    body: displayBody,
                    targetType: "Group",
                    targetGroupId: updated.Id,
                    targetUserId: null,
                    recipientUserIds: memberIds,
                    createdBy: userGuid,
                    linkUrl: updaterLink,
                    priority: "Normal",
                    ct: HttpContext.RequestAborted);

                // broadcast to members
                try
                {
                    string? savedLink = null;
                    if (!string.IsNullOrWhiteSpace(savedClassNotif?.Metadata))
                    {
                        try
                        {
                            using var doc = JsonDocument.Parse(savedClassNotif.Metadata);
                            if (doc.RootElement.TryGetProperty("linkUrl", out var p) && p.ValueKind == JsonValueKind.String)
                                savedLink = p.GetString();
                        }
                        catch { }
                    }

                    var targets = memberIds.Select(id => $"user_{id}").ToList();
                    targets.Add($"group_{updated.Id}");

                    var payload = new
                    {
                        id = savedClassNotif.Id,
                        title = savedClassNotif.Title,
                        body = savedClassNotif.Body,
                        linkUrl = savedLink ?? updaterLink,
                        priority = savedClassNotif.Priority,
                        targetType = savedClassNotif.TargetType,
                        targetGroupId = savedClassNotif.TargetGroupId,
                        createdAt = savedClassNotif.CreatedAt,
                        createdBy = savedClassNotif.CreatedBy,
                        isRead = false
                    };

                    await _notificationHub.Clients.Groups(targets).SendAsync("NotificationCreated", payload);
                }
                catch (Exception ex) { Console.WriteLine($"Broadcast class-members notification failed: {ex}"); }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Create/persist class-members notification error: {ex}");
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