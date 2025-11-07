using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.ClassDTOS;
using StudyHub.Backend.Api.Dtos.ClassworkDTOS;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.UseCases.Utils;
using System;
using System.Linq;
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

        public ClassNotificationController(
            ClassNotificationService service,
            AppUserService aUserService,
            ICloudinaryRepository fileStorage)
        {
            _service = service;
            _aUserService = aUserService;
            _fileStorage = fileStorage;
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

        // Create notification (supports multipart/form-data with files & links)
        // NOTE: service currently exposes CreateNotification (no file upload helper),
        // so controller will create notification first then upload files via injected ICloudinaryRepository
        // and persist file records via service.CreateNotificationFile(...) (service method wraps repository).
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
                    CreatedAt = DateTime.UtcNow,
                    AppUserId = dto.CreatedBy,
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

                // If links JSON provided, the frontend usually sends LinksJson => you can store as files or in a links table.
                // For now we ignore LinksJson or you can extend ClassNotification to store LinksJson if needed.

                // reload files/comments for response if desired
                var files = _service.GetFilesByNotification(createdNoti.Id);
                var response = createdNoti.ToNotificationDto(_aUserService.GetUserById(createdNoti.AppUserId), files.Select(f => f.ToFileDto()).ToList(), null);

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
                    var user = _aUserService.GetUserById(c.AppUserId);
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
                AppUserId = dto.CreatedBy
            };

            var created = _service.CreateComment(commentEntity);
            if (created == null) return StatusCode(500, new { success = false, message = "Unable to create comment." });

            var user = _aUserService.GetUserById(created.AppUserId);
            var response = new
            {
                id = created.Id,
                notificationId = created.NotificationId,
                content = created.Content,
                createdBy = created.AppUserId,
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
                    allowSubmission = n.AllowSubmission
                })
                .ToList();

            return Ok(new { success = true, message = "Danh sách classworks.", classes = classworks });
        }

       

        // Edit classwork (old route)
        [HttpPut("/api/Classwork/{id}")]
        public IActionResult EditClasswork(int id, [FromBody] EditClassworkDto dto)
        {
            var noti = _service.GetNotification(id);
            if (noti == null) return NotFound(new { success = false, message = "Không tìm thấy classwork" });

            if (!string.IsNullOrWhiteSpace(dto.Title)) noti.Title = dto.Title;
            noti.Description = dto.Description;
            noti.Deadline = dto.Deadline;
            noti.UpdatedAt = DateTime.UtcNow;

            var res = _service.EditNotification(noti);
            if (res == null) return StatusCode(500, new { success = false, message = "Cập nhật thất bại" });
            return Ok(new { success = true, message = "Đã update", data = res });
        }

        // Get detail (classwork detail + submissions) - old route
        [HttpGet("/api/Classwork/{id}/detail")]
        public IActionResult GetClassworkDetail(int id)
        {
            var noti = _service.GetNotification(id);
            if (noti == null) return NotFound(new { success = false, message = "Không tìm thấy classwork" });

            var submissions = _service.GetSubmissionsByNotificationId(id);
            return Ok(new { success = true, data = noti, submissions = submissions });
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
            return Ok(new { success = true, data = submit.ToSubmissionDto(files) });
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
                var submissionDto = refreshed?.ToSubmissionDto(files);

                return Ok(new { success = true, message = "Chấm điểm thành công.", data = submissionDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi khi chấm điểm: {ex.Message}", error = ex.ToString() });
            }
        }

        // DTO for comment creation
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