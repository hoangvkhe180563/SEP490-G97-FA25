using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Dtos.ClassDTOS;
using StudyHub.Backend.Api.Dtos.ClassworkDTOS;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Services;
using System.Collections.Generic;
using System.Net;
using System.Text.Json;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClassController : ControllerBase
    {
        private readonly ClassService _service;
        private readonly AppUserService _aUserService;
        private readonly AppRoleService _aRoleService;
        private readonly LocationService _locationService;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;


        public ClassController(ClassService service, AppUserService aUserService, AppRoleService aRoleService, LocationService locationService, IEmailService emailService, IConfiguration config)
        {
            _service = service;
            _aUserService = aUserService;
            _aRoleService = aRoleService;
            _locationService = locationService;
            _emailService = emailService;
            _config = config;
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
            // Controller: validation + mapping only
            var (classesEntities, totalItems, currentPage, pageLimit, totalPages) = _service.GetClassesPaged(query, status, memberid, page, limit);

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
        public IActionResult CreateClass([FromBody] CreateClassDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { success = false, message = "Tên lớp học không được để trống." });

            var entity = dto.ToEntity(); // ToEntity returns Domain.Class
            var createdClass = _service.CreateClass(entity);
            return CreatedAtAction(nameof(GetClasses), new { id = createdClass.Id }, createdClass.ToDetailDto());
        }

        [HttpGet("Subject")]
        public IActionResult GetSubject()
        {
            return Ok(_service.GetSubjects());
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] EditClassDto dto)
        {
            // Controller maps DTO -> primitives/domain and calls service
            var updated = _service.UpdateClassFromPrimitives(id, dto.Name, dto.Description, dto.UpdatedBy);
            if (updated == null) return NotFound();
            return Ok(updated.ToDetailDto());
        }

        //[HttpGet("{id}/members")]
        //public IActionResult GetClassMembers(int id)
        //{
        //    var cls = _service.GetClassById(id);
        //    if (cls == null)
        //        return NotFound(new { success = false, message = "Không tìm thấy lớp học." });

        //    var membersEntities = _service.GetClassMembers(id);

        //    var members = membersEntities
        //         .Select(m =>
        //         {
        //             var user = _aUserService.GetUserById(m.UserId);
        //             var role = _aRoleService.GetRolesByUser(m.UserId);
        //             var school = (user?.SchoolId).HasValue
        //                 ? _locationService.GetSchoolById(user!.SchoolId.Value)
        //                 : null;

        //             var commune = (user?.CommuneId).HasValue
        //                 ? _locationService.GetCommuneById(user!.CommuneId.Value)
        //                 : null;

        //             return m.ToMemberDto(user, role, school, commune);
        //         })
        //         .ToList();

        //    return Ok(new
        //    {
        //        success = true,
        //        message = "Lấy danh sách thành viên thành công.",
        //        data = members
        //    });
        //}

        [HttpGet("{id}/detail")]
        public IActionResult GetClassDetail(int id)
        {
            var cls = _service.GetClassById(id);
            if (cls == null)
                return NotFound(new { success = false, message = "Không tìm thấy lớp học." });

            var notificationsEntities = _service.GetClassNotifications(id);

            var notifications = notificationsEntities
                .Select(n =>
                {
                    var files = _service.GetFileByNotificationId(n.Id);
                    var comments = _service.GetCommentsByNotificationId(n.Id);

                    return n.ToNotificationDto(
                        _aUserService.GetUserById(n.AppUserId),
                        files.Select(f => f.ToFileDto()).ToList(),
                        comments.Select(c => c.ToCommentDto(_aUserService.GetUserById(c.AppUserId))).ToList()
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

        //[HttpGet("{classId}/notifications")]
        //public IActionResult GetNotificationsByClass(int classId)
        //{
        //    var notifications = _service.GetClassNotifications(classId)
        //        .Select(n => n.ToNotificationDto())
        //        .ToList();

        //    return Ok(new
        //    {
        //        success = true,
        //        message = "Lấy danh sách thông báo thành công.",
        //        data = notifications
        //    });
        //}

        //[HttpGet("notification/{notificationId}/comments")]
        //public IActionResult GetCommentsByNotification(int notificationId)
        //{
        //    var comments = _service.GetCommentsByNotificationId(notificationId)
        //        .Select(c => c.ToCommentDto(_aUserService.GetUserById(c.AppUserId)))
        //        .ToList();

        //    return Ok(new
        //    {
        //        success = true,
        //        message = "Lấy danh sách bình luận thành công.",
        //        data = comments
        //    });
        //}

        //[HttpPost("notifications")]
        //[Consumes("multipart/form-data")]
        //public async Task<IActionResult> CreateNotification([FromForm] CreateNotificationDto dto)
        //{
        //    try
        //    {
        //        if (string.IsNullOrWhiteSpace(dto.Title))
        //            return BadRequest(new { success = false, message = "Tiêu đề không được để trống." });

        //        if (dto.ClassId <= 0)
        //            return BadRequest(new { success = false, message = "ClassId không hợp lệ." });

        //        // Map DTO -> Domain entity here (Api project can reference Mapper)
        //        var notificationEntity = new ClassNotification
        //        {
        //            ClassId = dto.ClassId,
        //            Title = dto.Title.Trim(),
        //            Description = dto.Description?.Trim() ?? "",
        //            CreatedAt = DateTime.UtcNow,
        //            CreatedBy = dto.CreatedBy,
        //            AppUserId = dto.CreatedBy
        //        };

        //        // Delegate the whole business flow (file parsing/upload/saving links) to service
        //        var createdNoti = await _service.CreateNotificationWithFilesAsync(notificationEntity, dto.Files?.ToList(), dto.LinksJson);

        //        if (createdNoti == null)
        //        {
        //            return StatusCode(500, new { success = false, message = "Không tạo được thông báo." });
        //        }

        //        return Ok(new
        //        {
        //            success = true,
        //            message = "Tạo thông báo thành công.",
        //            data = createdNoti
        //        });
        //    }
        //    catch (ArgumentException aex)
        //    {
        //        return BadRequest(new { success = false, message = aex.Message });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new
        //        {
        //            success = false,
        //            message = $"Lỗi server: {ex.Message}",
        //            error = ex.ToString()
        //        });
        //    }
        //}

        public class CreateCommentDto
        {
            public string Content { get; set; } = string.Empty;
            public Guid CreatedBy { get; set; }
        }

        //[HttpPost("notifications/{notificationId}/comments")]
        //public async Task<IActionResult> AddCommentToNotification([FromRoute] int notificationId, [FromBody] CreateCommentDto dto)
        //{
        //    try
        //    {
        //        if (notificationId <= 0)
        //            return BadRequest(new { success = false, message = "Invalid notificationId." });

        //        if (string.IsNullOrWhiteSpace(dto.Content))
        //            return BadRequest(new { success = false, message = "Content cannot be empty." });

        //        var commentEntity = new ClassNotificationComment
        //        {
        //            NotificationId = notificationId,
        //            Content = dto.Content.Trim(),
        //            CreatedAt = DateTime.UtcNow,
        //            AppUserId = dto.CreatedBy
        //        };

        //        var created = _service.CreateNotificationComment(commentEntity);

        //        if (created == null)
        //            return StatusCode(500, new { success = false, message = "Unable to create comment." });

        //        var response = new
        //        {
        //            id = created.Id,
        //            notificationId = created.NotificationId,
        //            content = created.Content,
        //            createdBy = created.AppUserId,
        //            createdAt = created.CreatedAt,
        //            userFullname = _aUserService.GetUserById(created.AppUserId)?.Fullname ?? "",
        //            avatarUrl = _aUserService.GetUserById(created.AppUserId)?.Avatar ?? ""
        //        };

        //        return Ok(new { success = true, message = "Comment added", data = response });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { success = false, message = $"Server error: {ex.Message}", error = ex.ToString() });
        //    }
        //}

        //[HttpDelete("notifications/{notificationId}")]
        //public async Task<IActionResult> DeleteNotic(int notificationId)
        //{
        //    try
        //    {
        //        var ok = _service.DeleteNotificationById(notificationId);
        //        if (ok)
        //        {
        //            return Ok(new { success = true, message = "Deleted notification" });
        //        }
        //        else
        //        {
        //            return NotFound(new { success = false, message = "Notification not found or cannot be deleted" });
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { success = false, message = $"Server error: {ex.Message}", error = ex.ToString() });
        //    }
        //}

        //[HttpPost("{id}/invite")]
        //public async Task<IActionResult> InviteByEmails(int id, [FromBody] InviteRequest request)
        //{
        //    try
        //    {
        //        if (request?.Emails == null || request.Emails.Count == 0)
        //            return BadRequest(new { success = false, message = "Cần cung cấp ít nhất một email để mời." });

        //        var cls = _service.GetClassById(id);
        //        if (cls == null)
        //            return NotFound(new { success = false, message = "Không tìm thấy lớp học." });

        //        var baseFrontendUrl = _config["App:BaseUrl"]?.TrimEnd('/') ?? $"{Request.Scheme}://{Request.Host}";

        //        // Delegate invite flow to service (service will use repositories and IEmailService)
        //        var results = await _service.InviteByEmailsAsync(id, request.Emails, request.Role, request.Message, baseFrontendUrl);

        //        return Ok(new { success = true, message = "Đã gửi lời mời.", data = results });
        //    }
        //    catch (ArgumentException aex)
        //    {
        //        return BadRequest(new { success = false, message = aex.Message });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { success = false, message = $"Lỗi khi gửi lời mời: {ex.Message}", error = ex.ToString() });
        //    }
        //}

        //[HttpPost("{id}/members/{userId}/confirm")]
        //public IActionResult ConfirmMember(int id, string userId)
        //{
        //    try
        //    {
        //        var ok = _service.ConfirmMemberFromString(id, userId);
        //        if (ok == null) return BadRequest(new { success = false, message = "UserId không hợp lệ." });
        //        if (ok == false) return StatusCode(500, new { success = false, message = "Không thể xác nhận thành viên." });

        //        return Ok(new { success = true, message = "Thành viên đã được xác nhận (joined)." });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { success = false, message = $"Lỗi khi xác nhận: {ex.Message}", error = ex.ToString() });
        //    }
        //}

        //[HttpPost("{id}/members/{userId}/kick")]
        //public IActionResult KickMember(int id, string userId)
        //{
        //    try
        //    {
        //        var ok = _service.KickMemberFromString(id, userId);
        //        if (ok == null) return BadRequest(new { success = false, message = "UserId không hợp lệ." });
        //        if (ok == false) return StatusCode(500, new { success = false, message = "Không thể kick thành viên." });

        //        return Ok(new { success = true, message = "Thành viên đã bị kick (status set to kicked)." });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { success = false, message = $"Lỗi khi kick: {ex.Message}", error = ex.ToString() });
        //    }
        //}

        //[HttpGet("classworks/{id}")]
        //public IActionResult GetClasswork(int id)
        //{
        //    var cw = _service.GetClassworks(id);
        //    if (cw == null) return NotFound();
        //    var response = new
        //    {
        //        success = true,
        //        message = "Danh sách lớp học được tải thành công.",
        //        classes = cw,
        //    };
        //    return Ok(response);
        //}

        //[HttpPost("classworks")]
        //public IActionResult CreateClasswork([FromBody] CreateClassworkDto dto)
        //{
        //    if (dto.ClassId <= 0 || string.IsNullOrWhiteSpace(dto.Title))
        //        return BadRequest(new { success = false, message = "Thiếu thông tin classId hoặc title" });
        //    var entity = dto.ToEntity();
        //    var cw = _service.CreateClasswork(entity);
        //    return CreatedAtAction(nameof(GetClasswork), new { id = cw.ClassId }, cw);
        //}

        //[HttpPut("classworks/{id}")]
        //public IActionResult EditClasswork(int id, [FromBody] EditClassworkDto dto)
        //{
        //    var cw = _service.EditClassworkFromPrimitives(id, dto.Title, dto.Description, dto.Deadline);
        //    if (cw == null)
        //        return NotFound(new { success = false, message = "Không tìm thấy classwork" });

        //    return Ok(new { success = true, message = "Đã update", data = cw });
        //}

        //[HttpGet("classworks/{id}/detail")]
        //public IActionResult GetClassworkDetail(int id)
        //{
        //    var result = _service.GetClassworkDetail(id);
        //    if (result == null) return NotFound(new { success = false, message = "Không tìm thấy classwork" });
        //    return Ok(new { success = true, data = result.Value.Classwork, submissions = result.Value.Submissions });
        //}

        //[HttpPost("classworks/{id}/submit")]
        //[Consumes("multipart/form-data")]
        //public async Task<IActionResult> SubmitClasswork(int id, [FromForm] SubmitClassworkDto dto)
        //{
        //    try
        //    {
        //        var result = await _service.SubmitClassworkWithFilesAsync(id, dto.AppUserId, dto.Files?.ToList());
        //        if (result == null) return BadRequest(new { success = false, message = "Thiếu thông tin hoặc lỗi khi nộp bài" });

        //        return Ok(new
        //        {
        //            success = true,
        //            message = result.Value.IsResubmit ? "Đã nộp lại bài" : "Đã nộp bài mới",
        //            submissionId = result.Value.SubmissionId,
        //            files = result.Value.Files
        //        });
        //    }
        //    catch (ArgumentException aex)
        //    {
        //        return BadRequest(new { success = false, message = aex.Message });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { success = false, message = $"Lỗi khi nộp bài: {ex.Message}", error = ex.ToString() });
        //    }
        //}

        //[HttpGet("classworks/submission")]
        //public IActionResult GetSubmissionfile(int classworkID, Guid userid)
        //{
        //    var submitFile = _service.GetSubmissionByUserAndClasswork(classworkID, userid);

        //    if (submitFile == null)
        //    {
        //        return NotFound(new { success = false, message = "Không tìm thấy classwork" });
        //    }
        //    var fi = _service.GetSubmissionFiles(submitFile.Id);
        //    return Ok(new { success = true, data = submitFile.ToSubmissionDto(fi) });

        //}

        //[HttpGet("classworks/submissioncount/{classworkID}")]
        //public IActionResult GetSubmissionCount(int classworkID)
        //{
        //    var numberSubmission = _service.GetSubmissionCount(classworkID);
        //    return Ok(numberSubmission);
        //}

        //[HttpGet("classworks/membercount/{classworkID}")]
        //public IActionResult GetMemberCount(int classworkID)
        //{
        //    var numberMember = _service.GetMemberCount(classworkID);
        //    return Ok(numberMember);
        //}

        //[HttpGet("membercount/{classID}")]
        //public IActionResult GetMemberClassCount(int classID)
        //{
        //    var numberMember = _service.GetMemberClassCount(classID);
        //    return Ok(numberMember);
        //}
    }
}