using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using StudyHub.Backend.Api.Dtos.ClassDTOS;
using StudyHub.Backend.Api.Hubs;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClassMemberController : ControllerBase
    {
        private readonly ClassMemberService _service;
        private readonly ClassService _classService;
        private readonly AppUserService _aUserService;
        private readonly AppRoleService _aRoleService;
        private readonly AuthService _authService;
        private readonly LocationService _locationService;
        private readonly SmtpEmailService _emailService;
        private readonly IConfiguration _config;
        private readonly IHubContext<NotificationHub> _notificationHub;
        private readonly NotificationService _notificationService;
        private readonly IWebHostEnvironment _env;

        public ClassMemberController(ClassMemberService service, AuthService auth, AppUserService aUserService, AppRoleService aRoleService, LocationService locationService, SmtpEmailService emailService, IConfiguration config, ClassService classService, IHubContext<NotificationHub> hubContext, NotificationService notification, IWebHostEnvironment env)
        {
            _service = service;
            _aUserService = aUserService;
            _aRoleService = aRoleService;
            _locationService = locationService;
            _emailService = emailService;
            _config = config;
            _classService = classService;
            _notificationService = notification;
            _notificationHub = hubContext;
            _authService = auth;
            _env = env;
        }
        [HttpGet]
        public IActionResult GetMembers(int classId)
        {
            var cls = _classService.GetClassById(classId);
            if (cls == null) return NotFound(new { success = false, message = "Không tìm thấy lớp học." });

            var membersEntities = _service.GetClassMembers(classId);
            var members = membersEntities
                 .Select(m =>
                 {
                     var user = _aUserService.GetUserById(m.UserId);
                     var role = _aRoleService.GetRolesByUser(m.UserId);
#pragma warning disable CS8629 // Nullable value type may be null.
                     var school = (user?.SchoolId).HasValue ? _locationService.GetSchoolById(user!.SchoolId.Value) : null;
#pragma warning restore CS8629 // Nullable value type may be null.
#pragma warning disable CS8629 // Nullable value type may be null.
                     var commune = (user?.CommuneId).HasValue ? _locationService.GetCommuneById(user!.CommuneId.Value) : null;
#pragma warning restore CS8629 // Nullable value type may be null.
                     return m.ToMemberDto(user, role, school, commune);
                 })
                 .ToList();

            return Ok(new { success = true, message = "Lấy danh sách thành viên thành công.", data = members });
        }

        [HttpPost("invite")]
        public async Task<IActionResult> Invite(int classId, [FromBody] InviteRequest request)
        {
            if (request?.Emails == null || request.Emails.Count == 0)
                return BadRequest(new { success = false, message = "Cần cung cấp ít nhất một email để mời." });

            var cls = _classService.GetClassById(classId);
            if (cls == null) return NotFound(new { success = false, message = "Không tìm thấy lớp học." });

            var baseFrontendUrl = _config[$"App:BaseUrl:{_env.EnvironmentName}"]?.TrimEnd('/') ?? $"{Request.Scheme}://{Request.Host}";

#pragma warning disable CS8604 // Possible null reference argument.
            var results = await _service.InviteByEmailsAsync(classId, request.Emails, request.Role, request.Message, baseFrontendUrl);
#pragma warning restore CS8604 // Possible null reference argument.
            return Ok(new { success = true, message = "Đã gửi lời mời.", data = results });
        }
        [HttpPost("invite-excel")]
        public async Task<IActionResult> InviteExcel(int classId, IFormFile file, [FromForm] string role = "Student", [FromForm] string? message = null)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { success = false, message = "Cần cung cấp file Excel." });

            var cls = _classService.GetClassById(classId);
            if (cls == null) return NotFound(new { success = false, message = "Không tìm thấy lớp học." });

            var baseFrontendUrl = _config[$"App:BaseUrl:{_env.EnvironmentName}"]?.TrimEnd('/') ?? $"{Request.Scheme}://{Request.Host}";

            try
            {
#pragma warning disable CS8604 // Possible null reference argument.
                var results = await _service.InviteByExcelAsync(classId, file, role ?? "Student", message, baseFrontendUrl);
#pragma warning restore CS8604 // Possible null reference argument.
                return Ok(new { success = true, message = "Đã gửi lời mời từ file.", data = results });
            }
            catch (ArgumentException aex)
            {
                return BadRequest(new { success = false, message = aex.Message });
            }
            catch (Exception ex)
            {
                // log if needed
                return StatusCode(500, new { success = false, message = $"Lỗi server: {ex.Message}" });
            }
        }
        // Helper: notify homeroom teachers of a class (best-effort)
        private async Task NotifyHomeroomTeachersAsync(int classId, string title, string body, string link)
        {
            try
            {
                List<Guid> maintainerIds = new List<Guid>();
                try
                {
                    var teachers = _notificationService.GetUsersByRoleAndClass("Homeroom Teacher", classId);
                    maintainerIds = teachers.Select(t => t.Id).Where(id => id != Guid.Empty).Distinct().ToList();
                    Console.WriteLine($"GetUsersByRoleAndClass returned {maintainerIds.Count} homeroom teacher(s) for class {classId}.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"GetUsersByRoleAndClass failed: {ex.Message}");
                }

                if (!maintainerIds.Any())
                {
                    Console.WriteLine($"No Homeroom Teachers found for class {classId}; skipping notification.");
                    return;
                }

                var currentUser = _authService.GetCurrentUser();

                int groupId;
                List<Guid> groupMembers;
                try
                {
                    var ensureResult = await _notificationService.EnsureCompositeGroupAsync(
                        schoolId: null,
                        roleNames: new[] { "Homeroom Teacher" },
                        classId: classId,
                        grade: null,
                        explicitUserIds: maintainerIds,
                        customName: $"HomeroomTeachers_Class_{classId}",
                        createdBy: currentUser.Id,
                        ct: HttpContext.RequestAborted
                    );

                    groupId = ensureResult.GroupId;
                    groupMembers = ensureResult.MemberIds;
                    Console.WriteLine($"Ensured group {groupId} with {groupMembers.Count} member(s).");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"EnsureCompositeGroupAsync failed: {ex.Message}");
                    // fallback: if we cannot create a group, still try to send to individual recipients
                    groupId = 0;
                    groupMembers = maintainerIds;
                }

                // 3) Create and persist a notification that targets the group (if group created) or falls back to recipients
                var saved = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                    title: title,
                    body: body,
                    targetType: "Group",
                    targetGroupId: groupId == 0 ? (int?)null : groupId,
                    targetUserId: null,
                    recipientUserIds: groupMembers,
                    createdBy: currentUser.Id,
                    linkUrl: "/class/" + classId,
                    priority: "Normal",
                    ct: HttpContext.RequestAborted
                );

                if (saved == null)
                {
                    Console.WriteLine("CreateAndSendNotificationToRecipientsAsync returned null (notification not saved).");
                    return;
                }

                // 4) Broadcast real-time via SignalR to the group (use a group name convention like "group_{groupId}")
                try
                {
                    if (groupId != 0)
                    {
                        var groupName = $"group_{groupId}";
                        var payload = new
                        {
                            id = saved.Id,
                            title = saved.Title,
                            body = saved.Body,
                            linkUrl = "/class/" + classId,
                            priority = saved.Priority,
                            targetType = saved.TargetType,
                            targetGroupId = saved.TargetGroupId,
                            createdAt = saved.CreatedAt,
                            createdBy = saved.CreatedBy,
                            isRead = false
                        };

                        await _notificationHub.Clients.Group(groupName).SendAsync("NotificationCreated", payload, HttpContext.RequestAborted);
                        Console.WriteLine($"Broadcasted notification to SignalR group '{groupName}'.");
                    }
                    else
                    {
                        // fallback: broadcast to individual user groups like before
                        var userTargets = groupMembers.Select(id => $"user_{id}").ToArray();
                        var payload = new
                        {
                            id = saved.Id,
                            title = saved.Title,
                            body = saved.Body,
                            linkUrl = link,
                            priority = saved.Priority,
                            targetType = saved.TargetType,
                            targetGroupId = saved.TargetGroupId,
                            createdAt = saved.CreatedAt,
                            createdBy = saved.CreatedBy,
                            isRead = false
                        };

                        await _notificationHub.Clients.Groups(userTargets).SendAsync("NotificationCreated", payload, HttpContext.RequestAborted);
                        Console.WriteLine($"Broadcasted notification to {userTargets.Length} connected user groups (fallback).");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Broadcast homeroom notifications failed: {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"NotifyHomeroomTeachersAsync error: {ex.Message}");
            }
        }

        [HttpPost("{userId}/confirm")]
        public async Task<IActionResult> Confirm(int classId, string userId)
        {
            var ok = _service.ConfirmMemberFromString(classId, userId);
            if (ok == null) return BadRequest(new { success = false, message = "UserId không hợp lệ." });
            if (ok == false) return StatusCode(500, new { success = false, message = "Không thể xác nhận thành viên." });

            // Fire-and-forget notification (best-effort)
            try
            {
#pragma warning disable CS8602 // Dereference of a possibly null reference.
                await NotifyHomeroomTeachersAsync(
                    classId,
                    title: "Thành viên mới đã được xác nhận",
                    body: $"Thành viên {_authService.GetUserInfoById(Guid.Parse(userId)).User.Fullname} đã được xác nhận vào lớp {classId}.",
                    link: $"/class/{classId}"
                );
#pragma warning restore CS8602 // Dereference of a possibly null reference.
            }
            catch (Exception ex)
            {
                Console.WriteLine($"NotifyHomeroomTeachersAsync (confirm) failed: {ex.Message}");
            }

            return Ok(new { success = true, message = "Thành viên đã được xác nhận (joined)." });
        }

        [HttpPost("{userId}/decline")]
        public async Task<IActionResult> Decline(int classId, string userId)
        {
            var ok = _service.DeclineMemberFromString(classId, userId);
            if (ok == null) return BadRequest(new { success = false, message = "UserId không hợp lệ." });
            if (ok == false) return StatusCode(500, new { success = false, message = "Không thể từ chối thành viên." });

            try
            {
                await NotifyHomeroomTeachersAsync(
                    classId,
                    title: "Yêu cầu tham gia bị từ chối",
                    body: $"Một yêu cầu tham gia lớp {classId} đã bị từ chối.",
                    link: $"/class/{classId}"
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"NotifyHomeroomTeachersAsync (decline) failed: {ex.Message}");
            }

            return Ok(new { success = true, message = "Yêu cầu đã bị từ chối." });
        }

        [HttpPost("{userId}/kick")]
        public async Task<IActionResult> Kick(int classId, string userId)
        {
            var ok = _service.KickMemberFromString(classId, userId);
            if (ok == null) return BadRequest(new { success = false, message = "UserId không hợp lệ." });
            if (ok == false) return StatusCode(500, new { success = false, message = "Không thể kick thành viên." });

            try
            {
                await NotifyHomeroomTeachersAsync(
                    classId,
                    title: "Thành viên bị loại khỏi lớp",
                    body: $"Một thành viên đã bị loại khỏi lớp {classId}.",
                    link: $"/class/{classId}"
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"NotifyHomeroomTeachersAsync (kick) failed: {ex.Message}");
            }

            return Ok(new { success = true, message = "Thành viên đã bị kick (status set to kicked)." });
        }
    }
}
