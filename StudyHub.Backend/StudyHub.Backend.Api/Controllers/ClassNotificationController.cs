using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.ClassDTOS;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClassNotificationController : ControllerBase
    {
        private readonly ClassService _service;
        private readonly AppUserService _aUserService;
        public ClassNotificationController(ClassService service, AppUserService aUserService)
        {
            _service = service;
            _aUserService = aUserService;
        }
        [HttpGet("class/{classId}")]
        public IActionResult GetByClass(int classId)
        {
            var notifications = _service.GetClassNotifications(classId)
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
                    Title = dto.Title.Trim(),
                    Description = dto.Description?.Trim() ?? "",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = dto.CreatedBy,
                    AppUserId = dto.CreatedBy
                };

                var createdNoti = await _service.CreateNotificationWithFilesAsync(notificationEntity, dto.Files?.ToList(), dto.LinksJson);
                if (createdNoti == null)
                    return StatusCode(500, new { success = false, message = "Không tạo được thông báo." });

                return Ok(new { success = true, message = "Tạo thông báo thành công.", data = createdNoti });
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
                .Select(c => c.ToCommentDto(_aUserService.GetUserById(c.AppUserId)))
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

            var created = _service.CreateNotificationComment(commentEntity);
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
            var ok = _service.DeleteNotificationById(notificationId);
            if (ok) return Ok(new { success = true, message = "Deleted notification" });
            return NotFound(new { success = false, message = "Notification not found or cannot be deleted" });
        }

        public class CreateCommentRequest
        {
            public string Content { get; set; } = "";
            public Guid CreatedBy { get; set; }
        }
    }
}
