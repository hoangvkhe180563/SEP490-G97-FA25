using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using StudyHub.Backend.Api.Dtos.ClassDTOS;
using StudyHub.Backend.Api.Dtos.ClassworkDTOS;
using StudyHub.Backend.Api.Hubs;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.UseCases.Utils;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text.Json;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClassNotificationController : ControllerBase
    {
        private readonly ClassNotificationService _service;
        private readonly AppUserService _aUserService;
        private readonly ICloudinaryRepository _fileStorage;
        private readonly IHubContext<ClassNotificationHub> _hubContext;
        private readonly IHubContext<NotificationHub> _notificationHub; // controller chỉ gửi hub, logic tạo notif hệ thống dùng NotificationService
        private readonly ClassService _classService; // để lấy tên lớp
        private readonly NotificationService _notificationService;

        public ClassNotificationController(
            ClassNotificationService service,
            AppUserService aUserService,
            ICloudinaryRepository fileStorage,
            IHubContext<ClassNotificationHub> hubContext,
            IHubContext<NotificationHub> notificationHub,
            ClassService classService,
            NotificationService notificationService)
        {
            _service = service ?? throw new ArgumentNullException(nameof(service));
            _aUserService = aUserService ?? throw new ArgumentNullException(nameof(aUserService));
            _fileStorage = fileStorage ?? throw new ArgumentNullException(nameof(fileStorage));
            _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
            _notificationHub = notificationHub ?? throw new ArgumentNullException(nameof(notificationHub));
            _classService = classService ?? throw new ArgumentNullException(nameof(classService));
            _notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
        }

        // Helper: build link for class based on user's role (copied logic from ClassController)
        private string BuildClassLinkForUser(Guid userId, int classId)
        {
            var roleSegment = "student";
            var isManager = false;

            try
            {
                var user = _aUserService.GetUserById(userId);
                if (user != null)
                {
                    var rolesProp = user.GetType().GetProperty("Roles");
                    if (rolesProp != null)
                    {
                        var rolesVal = rolesProp.GetValue(user) as System.Collections.IEnumerable;
                        if (rolesVal != null)
                        {
                            foreach (var r in rolesVal)
                            {
                                var nameProp = r?.GetType().GetProperty("Name");
                                if (nameProp != null)
                                {
                                    var nameVal = nameProp.GetValue(r) as string;
                                    if (string.IsNullOrWhiteSpace(nameVal)) continue;

                                    var n = nameVal.Trim();
                                    if (n.IndexOf("School Admin", StringComparison.OrdinalIgnoreCase) >= 0)
                                    {
                                        isManager = true;
                                        break;
                                    }

                                    if (n.IndexOf("teacher", StringComparison.OrdinalIgnoreCase) >= 0)
                                    {
                                        roleSegment = "teacher";
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
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
            catch
            {
                // fallback to defaults
            }

            if (isManager)
            {
                return "/class/manager/management-classes";
            }

            return $"/class/{roleSegment}/{classId}";
        }

        //
        // ---------- NOTIFICATIONS (unified) ----------
        //

        // GET: /api/ClassNotification/class/{classId}
        [HttpGet("class/{classId}")]
        public IActionResult GetByClass(int classId)
        {
            var notifications = _service.GetNotifications(classId)
                .Select(n => n.ToNotificationDto())
                .ToList();

            return Ok(new { success = true, message = "Lấy danh sách thông báo thành công.", data = notifications });
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create([FromForm] CreateNotificationDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Title))
                    return BadRequest(new { success = false, message = "Tiêu đề không được để trống." });
                if (dto.ClassId <= 0)
                    return BadRequest(new { success = false, message = "ClassId không hợp lệ." });

                var notificationEntity = new ClassNotification
                {
                    ClassId = dto.ClassId,
                    Type = dto.Type ?? "notification",
                    Title = dto.Title.Trim(),
                    Description = dto.Description?.Trim() ?? "",
                    CreatedAt = DateTime.Now,
                    CreatedBy = dto.CreatedBy,
                    Deadline = dto.Deadline,
                    MaxScore = dto.MaxScore,
                    GradeType = dto.GradeType,
                    AllowSubmission = dto.AllowSubmission,
                    InstructionsHtml = dto.InstructionsHtml
                };

                var createdNoti = _service.CreateNotification(notificationEntity);
                if (createdNoti == null)
                    return StatusCode(500, new { success = false, message = "Không tạo được thông báo." });

                // Upload files nếu có
                if (dto.Files != null && dto.Files.Any())
                {
                    foreach (var formFile in dto.Files)
                    {
                        if (formFile == null || formFile.Length == 0) continue;
                        try
                        {
                            var uploadedUrl = await _fileStorage.UploadFileAsync(formFile, FileConstants.ClassNotificationUploadPAth);
                            if (!string.IsNullOrWhiteSpace(uploadedUrl))
                            {
                                var fileEntity = new ClassNotificationFile
                                {
                                    NotificationId = createdNoti.Id,
                                    FileName = formFile.FileName,
                                    FileUrl = uploadedUrl,
                                    ThumbnailUrl = null,
                                    FileType = formFile.ContentType
                                };
                                _service.CreateNotificationFile(fileEntity);
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Upload file failed: {ex.Message}");
                        }
                    }
                }

                // Upload links nếu có
                if (dto.Links != null && dto.Links.Any())
                {
                    foreach (var link in dto.Links)
                    {
                        if (link == null) continue;
                        try
                        {
                            var fileEntity = new ClassNotificationFile
                            {
                                NotificationId = createdNoti.Id,
                                FileName = link.Title,
                                FileUrl = link.Url,
                                ThumbnailUrl = null,
                            };
                            _service.CreateNotificationFile(fileEntity);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Create link file failed: {ex.Message}");
                        }
                    }
                }

                var files = _service.GetFilesByNotification(createdNoti.Id);
                var response = createdNoti.ToNotificationDto(_aUserService.GetUserById(createdNoti.CreatedBy), files.Select(f => f.ToFileDto()).ToList(), null);

                // Tạo notification hệ thống bằng NotificationService (controller chỉ gửi hub)
                try
                {
                    Guid actorId = dto.CreatedBy;
                    var actor = _aUserService.GetUserById(actorId);
                    var actorName = actor?.Fullname ?? "Người dùng";

                    var cls = _classService.GetClassById(createdNoti.ClassId);
                    var className = cls?.Name ?? $"lớp {createdNoti.ClassId}";

                    var isClasswork = createdNoti.Type != null &&
                                      createdNoti.Type.Equals("classwork", StringComparison.OrdinalIgnoreCase);

                    var displayTitle = isClasswork
                        ? $"{actorName} đã giao bài tập cho {className}"
                        : $"{actorName} đã thông báo tới {className}";

                    var body = createdNoti.Title;

                    // IMPORTANT: align behavior with ClassController.Create
                    // Use placeholder base "/class" for group broadcasts so clients resolve per-role.
                    var creatorLink = "/class/" + dto.ClassId;

                    // 1) Send to maintainers (if any)
                    List<Guid> maintainerIds = new List<Guid>();
                    if (actor?.SchoolId != null)
                    {
                        maintainerIds = _notificationService.GetMaintainersForSchool(actor.SchoolId.Value);
                    }

                    if (maintainerIds != null && maintainerIds.Any())
                    {
                        var savedMaint = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                            title: displayTitle,
                            body: body,
                            targetType: "Group",
                            targetGroupId: null,
                            targetUserId: null,
                            recipientUserIds: maintainerIds,
                            createdBy: actorId,
                            linkUrl: creatorLink,
                            priority: "High",
                            ct: HttpContext.RequestAborted);

                        try
                        {
                            var groupTargets = maintainerIds.Select(id => $"user_{id}").ToList();
                            var payload = new
                            {
                                id = savedMaint.Id,
                                title = savedMaint.Title,
                                body = savedMaint.Body,
                                linkUrl = creatorLink,
                                priority = savedMaint.Priority,
                                targetType = savedMaint.TargetType,
                                targetGroupId = savedMaint.TargetGroupId,
                                createdAt = savedMaint.CreatedAt,
                                createdBy = savedMaint.CreatedBy,
                                isRead = false
                            };
                            await _notificationHub.Clients.Groups(groupTargets).SendAsync("NotificationCreated", payload, HttpContext.RequestAborted);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Broadcast maintainer notification failed: {ex.Message}");
                        }
                    }

                    // 3) Send to class members (group) -- KEEP group broadcast, remove personal notifications
                    var memberIds = _service.GetMemberIdsByClass(createdNoti.ClassId) ?? new List<Guid>();
                    if (memberIds.Any())
                    {
                        var savedClassNotif = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                            title: displayTitle,
                            body: body,
                            targetType: "Group",
                            targetGroupId: createdNoti.ClassId,
                            targetUserId: null,
                            recipientUserIds: memberIds,
                            createdBy: actorId,
                            linkUrl: creatorLink,
                            priority: "Normal",
                            ct: HttpContext.RequestAborted);

                        try
                        {
                            var targets = memberIds.Select(id => $"user_{id}").ToList();
                            targets.Add($"group_{createdNoti.ClassId}");

                            var payload = new
                            {
                                id = savedClassNotif.Id,
                                title = savedClassNotif.Title,
                                body = savedClassNotif.Body,
                                linkUrl = creatorLink,
                                priority = savedClassNotif.Priority,
                                targetType = savedClassNotif.TargetType,
                                targetGroupId = savedClassNotif.TargetGroupId,
                                createdAt = savedClassNotif.CreatedAt,
                                createdBy = savedClassNotif.CreatedBy,
                                isRead = false
                            };

                            await _notificationHub.Clients.Groups(targets).SendAsync("NotificationCreated", payload, HttpContext.RequestAborted);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Broadcast class-members notification failed: {ex.Message}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Create/send notifications error: {ex.Message}");
                }

                // Legacy broadcast (giữ nếu frontend cũ dùng ClassNotificationHub)
                try
                {
                    await _hubContext.Clients.Group($"class_{createdNoti.ClassId}")
                        .SendAsync("NewNotification", createdNoti.ClassId, createdNoti.Title);

                    await _hubContext.Clients.Group($"class_{createdNoti.ClassId}")
                        .SendAsync("NewNotificationFull", response);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Legacy hub broadcast failed: {ex.Message}");
                }

                return Ok(new { success = true, message = "Tạo thông báo thành công.", data = response });
            }
            catch (ArgumentException aex)
            {
                return BadRequest(new { success = false, message = aex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi server: {ex.Message}", error = ex.ToString() });
            }
        }

        //
        // ---------- CLASSWORK / ASSIGNMENT endpoints (compat) ----------
        //

        [HttpPut("/api/Classwork/{id}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> EditClasswork(int id, [FromForm] EditClassworkDto dto)
        {
            try
            {
                var noti = _service.GetNotification(id);
                if (noti == null) return NotFound(new { success = false, message = "Không tìm thấy classwork" });

                if (!string.IsNullOrWhiteSpace(dto.Title)) noti.Title = dto.Title.Trim();
                noti.Description = dto.Description ?? noti.Description;
                noti.Deadline = dto.Deadline ?? noti.Deadline;
                noti.UpdatedAt = DateTime.Now;

                if (dto.MaxScore.HasValue) noti.MaxScore = dto.MaxScore.Value;
                if (!string.IsNullOrWhiteSpace(dto.GradeType)) noti.GradeType = dto.GradeType;
                noti.AllowSubmission = dto.AllowSubmission;
                if (!string.IsNullOrWhiteSpace(dto.InstructionsHtml)) noti.InstructionsHtml = dto.InstructionsHtml;

                var res = _service.EditNotification(noti);
                if (res == null) return StatusCode(500, new { success = false, message = "Cập nhật thất bại" });

                var existingFiles = _service.GetFilesByNotification(res.Id) ?? new List<ClassNotificationFile>();
                var keptIds = (dto.KeptFileIds ?? Array.Empty<int>()).ToHashSet();
                var toRemove = existingFiles.Where(f => !keptIds.Contains(f.Id)).ToList();
                if (toRemove.Any())
                {
                    foreach (var fileToRemove in toRemove)
                    {
                        try { _service.DeleteNotificationFileById(fileToRemove.Id); } catch { }
                    }
                }

                if (dto.Files != null && dto.Files.Any())
                {
                    foreach (var formFile in dto.Files)
                    {
                        if (formFile == null || formFile.Length == 0) continue;
                        try
                        {
                            var uploadedUrl = await _fileStorage.UploadFileAsync(formFile, FileConstants.ClassNotificationUploadPAth);
                            if (!string.IsNullOrWhiteSpace(uploadedUrl))
                            {
                                var fileEntity = new ClassNotificationFile
                                {
                                    NotificationId = res.Id,
                                    FileName = formFile.FileName,
                                    FileUrl = uploadedUrl,
                                    ThumbnailUrl = null,
                                    FileType = formFile.ContentType
                                };
                                _service.CreateNotificationFile(fileEntity);
                            }
                        }
                        catch { }
                    }
                }

                if (dto.Links != null && dto.Links.Any())
                {
                    foreach (var link in dto.Links)
                    {
                        if (link == null) continue;
                        try
                        {
                            var fileEntity = new ClassNotificationFile
                            {
                                NotificationId = res.Id,
                                FileName = link.Title,
                                FileUrl = link.Url,
                                ThumbnailUrl = null,
                                FileType = null
                            };
                            _service.CreateNotificationFile(fileEntity);
                        }
                        catch { }
                    }
                }

                var files = _service.GetFilesByNotification(res.Id);
                var response = res.ToNotificationDto(_aUserService.GetUserById(res.CreatedBy), files.Select(f => f.ToFileDto()).ToList(), null);

                // Tạo notification hệ thống qua NotificationService
                try
                {
                    var actor = _aUserService.GetUserById(res.CreatedBy);
                    var actorName = actor?.Fullname ?? "Người dùng";

                    var cls = _classService.GetClassById(res.ClassId);
                    var className = cls?.Name ?? $"lớp {res.ClassId}";

                    var displayTitle = $"{actorName} đã cập nhật bài tập cho {className}";
                    var body = $"{actorName} - {res.Title}";
                    var updaterLink = "/class/" + res.ClassId;

                    // maintainers
                    var maintainerIds = actor?.SchoolId != null ? _notificationService.GetMaintainersForSchool(actor.SchoolId.Value) : new List<Guid>();
                    if (maintainerIds.Any())
                    {
                        var savedMaint = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                            title: displayTitle,
                            body: body,
                            targetType: "Group",
                            targetGroupId: null,
                            targetUserId: null,
                            recipientUserIds: maintainerIds,
                            createdBy: res.CreatedBy,
                            linkUrl: updaterLink,
                            priority: "High",
                            ct: HttpContext.RequestAborted);

                        try
                        {
                            var groupTargets = maintainerIds.Select(id => $"user_{id}").ToList();
                            var payload = new
                            {
                                id = savedMaint.Id,
                                title = savedMaint.Title,
                                body = savedMaint.Body,
                                linkUrl = updaterLink,
                                priority = savedMaint.Priority,
                                targetType = savedMaint.TargetType,
                                targetGroupId = savedMaint.TargetGroupId,
                                createdAt = savedMaint.CreatedAt,
                                createdBy = savedMaint.CreatedBy,
                                isRead = false
                            };
                            await _notificationHub.Clients.Groups(groupTargets).SendAsync("NotificationCreated", payload, HttpContext.RequestAborted);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Broadcast maintainer notification failed: {ex.Message}");
                        }
                    }

                    // members (group only)
                    var memberIds = _service.GetMemberIdsByClass(res.ClassId) ?? new List<Guid>();
                    if (memberIds.Any())
                    {
                        var savedClassNotif = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                            title: displayTitle,
                            body: body,
                            targetType: "Group",
                            targetGroupId: res.ClassId,
                            targetUserId: null,
                            recipientUserIds: memberIds,
                            createdBy: res.CreatedBy,
                            linkUrl: updaterLink,
                            priority: "Normal",
                            ct: HttpContext.RequestAborted);

                        try
                        {
                            var targets = memberIds.Select(id => $"user_{id}").ToList();
                            targets.Add($"group_{res.ClassId}");

                            var payload = new
                            {
                                id = savedClassNotif.Id,
                                title = savedClassNotif.Title,
                                body = savedClassNotif.Body,
                                linkUrl = updaterLink,
                                priority = savedClassNotif.Priority,
                                targetType = savedClassNotif.TargetType,
                                targetGroupId = savedClassNotif.TargetGroupId,
                                createdAt = savedClassNotif.CreatedAt,
                                createdBy = savedClassNotif.CreatedBy,
                                isRead = false
                            };

                            await _notificationHub.Clients.Groups(targets).SendAsync("NotificationCreated", payload, HttpContext.RequestAborted);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Broadcast class-members notification failed: {ex.Message}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Broadcast classwork notification failed: {ex.Message}");
                }

                // Legacy broadcasts
                try
                {
                    await _hubContext.Clients.Group($"class_{res.ClassId}")
                        .SendAsync("UpdatedNotification", response);
                    await _hubContext.Clients.Group($"class_{res.ClassId}")
                        .SendAsync("NewNotification", res.ClassId, res.Title);
                }
                catch { }

                return Ok(new { success = true, message = "Đã update", data = response });
            }
            catch (ArgumentException aex)
            {
                return BadRequest(new { success = false, message = aex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi server: {ex.Message}", error = ex.ToString() });
            }
        }

        // ... Remaining endpoints unchanged (comments, submissions, deletes, counts) ...

        [HttpGet("{notificationId}/comments")]
        public IActionResult GetComments(int notificationId)
        {
            var comments = _service.GetCommentsByNotificationId(notificationId)
                .Select(c =>
                {
                    var user = _aUserService.GetUserById(c.CreatedBy);
                    return c.ToCommentDto(user);
                })
                .ToList();
            return Ok(new { success = true, message = "Lấy danh sách bình luận thành công.", data = comments });
        }

        [HttpPost("{notificationId}/comments")]
        public async Task<IActionResult> AddComment(int notificationId, [FromBody] CreateCommentRequest dto)
        {
            if (notificationId <= 0) return BadRequest(new { success = false, message = "Invalid notificationId." });
            if (string.IsNullOrWhiteSpace(dto.Content)) return BadRequest(new { success = false, message = "Content cannot be empty." });

            var commentEntity = new ClassNotificationComment
            {
                NotificationId = notificationId,
                Content = dto.Content.Trim(),
                CreatedAt = DateTime.Now,
                CreatedBy = dto.CreatedBy
            };

            var created = _service.CreateComment(commentEntity);
            if (created == null) return StatusCode(500, new { success = false, message = "Unable to create comment." });

            var user = _aUserService.GetUserById(created.CreatedBy);
            var response = new
            {
                id = created.Id,
                notificationId = created.NotificationId,
                content = created.Content,
                createdBy = created.CreatedBy,
                createdAt = created.CreatedAt,
                userFullname = user?.Fullname ?? "",
                avatarUrl = user?.Avatar ?? ""
            };

            // --- New: create/send notifications related to this comment (GROUP ONLY) ---
            try
            {
                // Get the original notification so we can determine classId, title, owner...
                var originalNoti = _service.GetNotification(notificationId);
                var classId = originalNoti?.ClassId ?? 0;
                var notiTitle = originalNoti?.Title ?? "Thông báo";
                var commenter = _aUserService.GetUserById(dto.CreatedBy);
                var commenterName = commenter?.Fullname ?? "Người dùng";
                var commentTitle = $"{commenterName} đã bình luận về {notiTitle}";
                var commentBody = created.Content;

                // Build a sensible link for recipients; reuse existing helper
                string linkForRecipients = "/class";
                if (classId > 0)
                {
                    // Use BuildClassLinkForUser to produce role-aware class link for recipients
                    linkForRecipients = BuildClassLinkForUser(dto.CreatedBy, classId);
                }

                // 1) Notify class members (group) if class exists (group only)
                if (classId > 0)
                {
                    try
                    {
                        var memberIds = _service.GetMemberIdsByClass(classId) ?? new List<Guid>();
                        if (memberIds.Any())
                        {
                            var savedClassNotif = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                                title: commentTitle,
                                body: commentBody,
                                targetType: "Group",
                                targetGroupId: classId,
                                targetUserId: null,
                                recipientUserIds: memberIds,
                                createdBy: dto.CreatedBy,
                                linkUrl: linkForRecipients,
                                priority: "Normal",
                                ct: HttpContext.RequestAborted);

                            try
                            {
                                var targets = memberIds.Select(id => $"user_{id}").ToList();
                                // also include group_{classId} so any group listeners receive it
                                targets.Add($"group_{classId}");
                                var payload = new
                                {
                                    id = savedClassNotif.Id,
                                    title = savedClassNotif.Title,
                                    body = savedClassNotif.Body,
                                    linkUrl = linkForRecipients,
                                    priority = savedClassNotif.Priority,
                                    targetType = savedClassNotif.TargetType,
                                    targetGroupId = savedClassNotif.TargetGroupId,
                                    createdAt = savedClassNotif.CreatedAt,
                                    createdBy = savedClassNotif.CreatedBy,
                                    isRead = false
                                };
                                await _notificationHub.Clients.Groups(targets).SendAsync("NotificationCreated", payload, HttpContext.RequestAborted);
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Broadcast class-members comment notification failed: {ex.Message}");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Create/send class-members comment notification error: {ex}");
                    }
                }
            }
            catch (Exception ex)
            {
                // Non-fatal: do not fail comment creation if notification sending fails
                Console.WriteLine($"Comment-related notification error: {ex}");
            }
            // --- end notification logic ---

            return Ok(new { success = true, message = "Comment added", data = response });
        }

        [HttpDelete("{notificationId}")]
        public IActionResult Delete(int notificationId)
        {
            var ok = _service.DeleteNotification(notificationId);
            if (ok) return Ok(new { success = true, message = "Deleted notification" });
            return NotFound(new { success = false, message = "Notification not found or cannot be deleted" });
        }

        [HttpGet("/api/Classwork/class/{classId}")]
        public IActionResult GetClassworksByClass(int classId)
        {
            var all = _service.GetNotifications(classId);
            var classworks = all
                .Where(n => string.Equals(n.Type, "classwork", StringComparison.OrdinalIgnoreCase))
                .Select(n => new
                {
                    id = n.Id,
                    classId = n.ClassId,
                    title = n.Title,
                    description = n.Description,
                    deadline = n.Deadline,
                    maxScore = n.MaxScore,
                    allowSubmission = n.AllowSubmission,
                    files = _service.GetFilesByNotification(n.Id)
                })
                .ToList();

            return Ok(new { success = true, message = "Danh sách classworks.", classes = classworks });
        }

        [HttpGet("/api/Classwork/{id}/detail")]
        public IActionResult GetClassworkDetail(int id)
        {
            var noti = _service.GetNotification(id);
            if (noti == null) return NotFound(new { success = false, message = "Không tìm thấy classwork" });

            var submissions = _service.GetSubmissionsByNotificationId(id);
            var file = _service.GetFilesByNotification(id);
            return Ok(new { success = true, data = noti, submissions = submissions, files = file });
        }

        [HttpPost("/api/Classwork/{id}/submit")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SubmitClasswork(int id, [FromForm] SubmitClassworkDto dto)
        {
            try
            {
                var result = await _service.SubmitNotificationWithFilesAsync(id, dto.AppUserId, dto.Files?.ToList());
                if (result == null) return BadRequest(new { success = false, message = "Thiếu thông tin hoặc lỗi khi nộp bài" });

                // Prepare response
                var responseObj = new
                {
                    success = true,
                    message = result.Value.IsResubmit ? "Đã nộp lại bài" : "Đã nộp bài mới",
                    submissionId = result.Value.SubmissionId,
                    files = result.Value.Files
                };

                // --- Removed personal notifications: only keep group broadcasts if needed ---
                // (No per-user notification will be created/sent here)

                return Ok(responseObj);
            }
            catch (ArgumentException aex)
            {
                return BadRequest(new { success = false, message = aex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi khi nộp bài: {ex.Message}", error = ex.ToString() });
            }
        }

        [HttpGet("/api/Classwork/submission")]
        public IActionResult GetSubmission([FromQuery] int classworkID, [FromQuery] Guid userid)
        {
            var submit = _service.GetSubmissionByUserAndNotification(classworkID, userid);
            if (submit == null) return NotFound(new { success = false, message = "Không tìm thấy submission" });

            var files = _service.GetSubmissionFiles(submit.Id);
            Guid gradeby = submit.GradedBy ?? Guid.Empty;
            var user = _aUserService.GetUserById(gradeby);
            return Ok(new { success = true, data = submit.ToSubmissionDto(files, user) });
        }

        [HttpGet("/api/Classwork/{classworkId}/submissions")]
        public IActionResult GetSubmissionsByClassworkID(int classworkId)
        {
            var submit = _service.GetSubmissionsByNotificationId(classworkId);
            if (submit == null) return NotFound(new { success = false, message = "Không tìm thấy submission" });
            var result = new List<object>();
            foreach (NotificationSubmission sub in submit)
            {
                var files = _service.GetSubmissionFiles(sub.Id);
                Guid gradeby = sub.GradedBy ?? Guid.Empty;
                var user = _aUserService.GetUserById(gradeby);
                result.Add(sub.ToSubmissionDto(files, user));
            }

            return Ok(new { success = true, data = result });
        }
        [HttpPost("{notificationId}/submissions/{submissionId}/grade")]
        public async Task<IActionResult> GradeSubmission(int notificationId, int submissionId, [FromBody] GradeSubmissionRequest dto)
        {
            try
            {
                if (notificationId <= 0 || submissionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid notificationId or submissionId." });

                // Call service to perform grading
                var ok = _service.GradeSubmission(notificationId, submissionId, dto.Score, dto.GradedBy, dto.Feedback);
                if (!ok)
                {
                    return BadRequest(new { success = false, message = "Grading failed or submission not found." });
                }

                // Attempt to return updated submission DTO (if available)
                var submissions = _service.GetSubmissionsByNotificationId(notificationId) ?? new List<NotificationSubmission>();
                var updated = submissions.FirstOrDefault(s => s.Id == submissionId);
                if (updated == null)
                {
                    return Ok(new { success = true, message = "Graded" });
                }

                var files = _service.GetSubmissionFiles(updated.Id) ?? new List<SubmissionFile>();
                Guid gradeBy = updated.GradedBy ?? Guid.Empty;
                var grader = gradeBy != Guid.Empty ? _aUserService.GetUserById(gradeBy) : null;
                var submissionDto = updated.ToSubmissionDto(files, grader);

                // Broadcast submission graded event to class group (non-blocking)
                try
                {
                    await _hubContext.Clients.Group($"class_{updated.NotificationId}")
                       .SendAsync("SubmissionGraded", submissionDto);
                }
                catch
                {
                }

                // --- Removed per-student personal notification: only group/hub broadcast kept ---

                return Ok(new { success = true, message = "Graded", data = submissionDto });
            }
            catch (ArgumentException aex)
            {
                return BadRequest(new { success = false, message = aex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi server khi chấm điểm: {ex.Message}", error = ex.ToString() });
            }
        }
        [HttpGet("/api/Classwork/submissioncount/{classworkID}")]
        public IActionResult GetSubmissionCount(int classworkID)
        {
            var numberSubmission = _service.GetSubmissionCount(classworkID);
            return Ok(numberSubmission);
        }

        [HttpGet("/api/Classwork/membercount/{classworkID}")]
        public IActionResult GetMemberCount(int classworkID)
        {
            var numberMember = _service.GetMemberCountByNotification(classworkID);
            return Ok(numberMember);
        }

        [HttpGet("class/{classId}/unread-count")]
        public IActionResult GetUnreadCount(int classId, [FromQuery] Guid userId, [FromQuery] string? type = null)
        {
            try
            {
                var typeArg = type ?? string.Empty;
                var total = _service.GetTotalUnreadNotifications(classId, userId, typeArg);

                return Ok(new { success = true, data = new { classId = classId, unread = total } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server khi lấy số thông báo chưa đọc.", error = ex.Message });
            }
        }

        public class CreateCommentRequest
        {
            public string Content { get; set; } = "";
            public Guid CreatedBy { get; set; }
        }
        public class GradeSubmissionRequest
        {
            public decimal Score { get; set; }
            public string Feedback { get; set; } = "";
            public Guid GradedBy { get; set; }
        }
    }
}