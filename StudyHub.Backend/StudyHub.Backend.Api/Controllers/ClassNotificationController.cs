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
using System.Security.Claims;
using System.Threading.Tasks;

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
        public ClassNotificationController(
            ClassNotificationService service,
            AppUserService aUserService,
            ICloudinaryRepository fileStorage,
            IHubContext<ClassNotificationHub> hubContext)
        {
            _service = service;
            _aUserService = aUserService;
            _fileStorage = fileStorage;
            _hubContext = hubContext;
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

                // create base notification (no files yet)
                var createdNoti = _service.CreateNotification(notificationEntity);
                if (createdNoti == null)
                    return StatusCode(500, new { success = false, message = "Không tạo được thông báo." });

                // If files provided, upload and persist file records
                if (dto.Files != null && dto.Files.Any())
                {
                    foreach (var formFile in dto.Files)
                    {
                        if (formFile == null || formFile.Length == 0) continue;
                        try
                        {
                            // upload file via cloudinary repository (service's file storage)
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
                        catch
                        {
                            // ignore file upload failures for other files
                        }
                    }
                }
                // If files provided, upload and persist file records
                if (dto.Links != null && dto.Links.Any())
                {
                    foreach (var link in dto.Links)
                    {
                        if (link == null ) continue;
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
                        catch
                        {
                            // ignore file upload failures for other files
                        }
                    }
                }

                var files = _service.GetFilesByNotification(createdNoti.Id);
                var response = createdNoti.ToNotificationDto(_aUserService.GetUserById(createdNoti.CreatedBy), files.Select(f => f.ToFileDto()).ToList(), null);
                try
                {
                    await _hubContext.Clients.Group($"class_{createdNoti.ClassId}")
                        .SendAsync("NewNotification", createdNoti.ClassId, createdNoti.Title);

                    try
                    {
                        await _hubContext.Clients.Group($"class_{createdNoti.ClassId}")
                            .SendAsync("NewNotificationFull", response);
                    }
                    catch
                    {
                        // ignore if full payload fails
                    }
                }
                catch
                {
                    // ignore hub broadcast failures to not break the API flow
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
        public IActionResult AddComment(int notificationId, [FromBody] CreateCommentRequest dto)
        {
            if (notificationId <= 0) return BadRequest(new { success = false, message = "Invalid notificationId." });
            if (string.IsNullOrWhiteSpace(dto.Content)) return BadRequest(new { success = false, message = "Content cannot be empty." });

            var commentEntity = new ClassNotificationComment
            {
                NotificationId = notificationId,
                Content = dto.Content.Trim(),
                CreatedAt = DateTime.UtcNow,
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

            return Ok(new { success = true, message = "Comment added", data = response });
        }

        [HttpDelete("{notificationId}")]
        public IActionResult Delete(int notificationId)
        {
            var ok = _service.DeleteNotification(notificationId);
            if (ok) return Ok(new { success = true, message = "Deleted notification" });
            return NotFound(new { success = false, message = "Notification not found or cannot be deleted" });
        }

        //
        // ---------- CLASSWORK / ASSIGNMENT endpoints (backwards-compatible routes) ----------
        // Keep the old /api/Classwork/* routes for compatibility with existing frontend.
        //

        // Get classworks (assignments) for a class -- backwards compatible path
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
                    files= _service.GetFilesByNotification(n.Id)
                })
                .ToList();

            return Ok(new { success = true, message = "Danh sách classworks.", classes = classworks });
        }



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
                noti.UpdatedAt = DateTime.UtcNow;

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
                        try
                        {
                            _service.DeleteNotificationFileById(fileToRemove.Id);
                        }
                        catch
                        {
                        }
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
                        catch
                        {
                        }
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
                        catch
                        {
                        }
                    }
                }

               

                var files = _service.GetFilesByNotification(res.Id);
                var response = res.ToNotificationDto(_aUserService.GetUserById(res.CreatedBy), files.Select(f => f.ToFileDto()).ToList(), null);

                try
                {
                    await _hubContext.Clients.Group($"class_{res.ClassId}")
                        .SendAsync("UpdatedNotification", response);
                    await _hubContext.Clients.Group($"class_{res.ClassId}")
                        .SendAsync("NewNotification", res.ClassId, res.Title);
                }
                catch
                {
                }

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

        [HttpGet("/api/Classwork/{id}/detail")]
        public IActionResult GetClassworkDetail(int id)
        {
            var noti = _service.GetNotification(id);
            if (noti == null) return NotFound(new { success = false, message = "Không tìm thấy classwork" });

            var submissions = _service.GetSubmissionsByNotificationId(id);
            var file = _service.GetFilesByNotification(id);
            return Ok(new { success = true, data = noti, submissions = submissions, files=file });
        }

        // Submit assignment (multipart/form-data) - old route
        [HttpPost("/api/Classwork/{id}/submit")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SubmitClasswork(int id, [FromForm] SubmitClassworkDto dto)
        {
            try
            {
                var result = await _service.SubmitNotificationWithFilesAsync(id, dto.AppUserId, dto.Files?.ToList());
                if (result == null) return BadRequest(new { success = false, message = "Thiếu thông tin hoặc lỗi khi nộp bài" });

                return Ok(new
                {
                    success = true,
                    message = result.Value.IsResubmit ? "Đã nộp lại bài" : "Đã nộp bài mới",
                    submissionId = result.Value.SubmissionId,
                    files = result.Value.Files
                });
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

        // Get a single user's submission for an assignment (old route)
        [HttpGet("/api/Classwork/submission")]
        public IActionResult GetSubmission([FromQuery] int classworkID, [FromQuery] Guid userid)
        {
            var submit = _service.GetSubmissionByUserAndNotification(classworkID, userid);
            if (submit == null) return NotFound(new { success = false, message = "Không tìm thấy submission" });

            var files = _service.GetSubmissionFiles(submit.Id);
            Guid gradeby = submit.GradedBy?? Guid.Empty;
            var user = _aUserService.GetUserById(gradeby);
            return Ok(new { success = true, data = submit.ToSubmissionDto(files,user) });
        }
        [HttpGet("/api/Classwork/{classworkId}/submissions")]
        public IActionResult GetSubmissionsByClassworkID( int classworkId)
        {
            var submit = _service.GetSubmissionsByNotificationId(classworkId);
            if (submit == null) return NotFound(new { success = false, message = "Không tìm thấy submission" });
            List<SubmissionFileDto> result=new List<SubmissionFileDto>();
            foreach(NotificationSubmission sub in submit)
            {
                var files = _service.GetSubmissionFiles(sub.Id);
                Guid gradeby = sub.GradedBy ?? Guid.Empty;
                var user = _aUserService.GetUserById(gradeby);
                result.Add(sub.ToSubmissionDto(files, user));

            }
           
            return Ok(new { success = true, data = result });
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

        [HttpGet("/api/Classwork/classmembercount/{classID}")]
        public IActionResult GetMemberClassCount(int classID)
        {
            var numberMember = _service.GetMemberClassCount(classID);
            return Ok(numberMember);
        }
        [HttpPost("{notificationId}/submissions/{submissionId}/grade")]
        public IActionResult GradeSubmission(int notificationId, int submissionId, [FromBody] GradeSubmissionRequest dto)
        {
            if (notificationId <= 0) return BadRequest(new { success = false, message = "Invalid notificationId." });
            if (submissionId <= 0) return BadRequest(new { success = false, message = "Invalid submissionId." });
            if (dto == null) return BadRequest(new { success = false, message = "Missing payload." });
            if (dto.Score < 0) return BadRequest(new { success = false, message = "Score must be non-negative." });
            if (dto.GradedBy == Guid.Empty) return BadRequest(new { success = false, message = "Invalid grader id." });

            try
            {
                // Use service which validates that submission belongs to notification
                var ok = _service.GradeSubmission(notificationId, submissionId, dto.Score, dto.GradedBy, dto.Feedback ?? "");
                if (!ok) return NotFound(new { success = false, message = "Submission not found or cannot be graded." });

                // Optionally return updated submission for frontend convenience
                var refreshed = _service.GetSubmissionsByNotificationId(notificationId).FirstOrDefault(s => s.Id == submissionId);
                var files = refreshed != null ? _service.GetSubmissionFiles(refreshed.Id) : new System.Collections.Generic.List<SubmissionFile>();
                var submissionDto = refreshed?.ToSubmissionDto(files,null);

                return Ok(new { success = true, message = "Chấm điểm thành công.", data = submissionDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi khi chấm điểm: {ex.Message}", error = ex.ToString() });
            }
        }
        [HttpGet("class/{classId}/unread-count")]
        public IActionResult GetUnreadCount(int classId, [FromQuery] Guid userId, [FromQuery] string? type = null)
        {
            try
            {
               

                var typeArg = type ?? string.Empty;

                // Gọi service
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