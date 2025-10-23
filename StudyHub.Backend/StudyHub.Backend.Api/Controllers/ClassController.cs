using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Dtos.ClassDTOS;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClassController : ControllerBase
    {
        private readonly ClassService _service;
        private readonly AppUserService _aUserService;
        private readonly AppRoleService _aRoleService;

        public ClassController(ClassService service, AppUserService aUserService, AppRoleService aRoleService)
        {
            _service = service;
            _aUserService = aUserService;
            _aRoleService = aRoleService;
        }

        [HttpGet]
        public IActionResult GetClasses(
         [FromQuery] string? query,
         [FromQuery] string? subject,
         [FromQuery] string? status,
         [FromQuery] int page = 1,
         [FromQuery] int limit = 10
     )
        {

            var allClasses = _service.GetClasses();

            var filteredClasses = allClasses

                .Where(c => string.IsNullOrEmpty(query) || c.Name.Contains(query, StringComparison.OrdinalIgnoreCase) && c.DeletedAt == null)

                .ToList();


            int totalItems = filteredClasses.Count;
            int totalPages = (int)Math.Ceiling((double)totalItems / limit);


            page = Math.Max(1, Math.Min(page, totalPages));


            var pagedClasses = filteredClasses
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToList();


            var allSubjects = _service.GetSubjects().ToDictionary(s => s.Id);
            var allTeachers = _service.GetTeachers().ToDictionary(u => u.Id);

            var classListDtos = pagedClasses.Select(c =>
            {
                Subject? subjectEntity = null;
                if (c.SubjectId.HasValue)
                {
                    allSubjects.TryGetValue(c.SubjectId.Value, out subjectEntity);
                }

                allTeachers.TryGetValue(c.CreatedBy, out AppUser? teacher);

                return c.ToListClassDto(teacher, subjectEntity);
            }).ToList();


            var response = new
            {
                success = true,
                message = "Danh sách lớp học được tải thành công.",
                classes = subject != null ? classListDtos.Where(c => c.SubjectName.Contains(subject, StringComparison.OrdinalIgnoreCase)) : classListDtos,
                meta = new
                {
                    total = totalItems,
                    page = page,
                    limit = limit,
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

            var createdClass = _service.CreateClass(dto.ToEntity());
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
            var existing = _service.GetClassById(id);
            if (existing == null) return NotFound();
            existing.Name = dto.Name;
            existing.Description = dto.Description;
            existing.SubjectId = dto.SubjectId;
            var updated = _service.UpdateClass(existing);
            return Ok(updated.ToDetailDto());
        }
        [HttpGet("{id}/detail")]
        public IActionResult GetClassDetail(int id)
        {
            var cls = _service.GetClassById(id);
            if (cls == null)
                return NotFound(new { success = false, message = "Không tìm thấy lớp học." });

        // Lấy dữ liệu phụ trực tiếp từ repository
        var members = _service.GetClassMembers(id)
        .Select(m =>
        {
            var roles = _aRoleService.GetRolesByUser(m.UserId).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
            return m.ToMemberDto(_aUserService.GetUserById(m.UserId), roles);
        })
        .ToList();

           

            // Lấy notification + comment + file
            var notifications = _service.GetClassNotifications(id)
                .Select(n =>
                {
                    var files = _service.GetFileByNotificationId(n.Id);
                    var comments = _service.GetCommentsByNotificationId(n.Id);

                    return n.ToNotificationDto(n.AppUser,
                        files.Select(f => f.ToFileDto()).ToList(),
                        comments.Select(c => c.ToCommentDto(_aUserService.GetUserById(c.AppUserId))).ToList()
                        
                    );
                })
                .ToList();

            var dto = cls.ToFullDetailDto(members, notifications);

            return Ok(new
            {
                success = true,
                message = "Lấy thông tin lớp học thành công.",
                data = dto
            });
        }

        [HttpGet("{classId}/notifications")]
        public IActionResult GetNotificationsByClass(int classId)
        {
            var notifications = _service.GetClassNotifications(classId)
                .Select(n => n.ToNotificationDto())
                .ToList();

            return Ok(new
            {
                success = true,
                message = "Lấy danh sách thông báo thành công.",
                data = notifications
            });
        }

        [HttpGet("notification/{notificationId}/comments")]
        public IActionResult GetCommentsByNotification(int notificationId)
        {
            var comments = _service.GetCommentsByNotificationId(notificationId)
                .Select(c => c.ToCommentDto(_aUserService.GetUserById(c.AppUserId))) // mapping dto (tạo mapper nếu chưa có)
                .ToList();

            return Ok(new
            {
                success = true,
                message = "Lấy danh sách bình luận thành công.",
                data = comments
            });
        }

        [HttpPost("notifications")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateNotification([FromForm] CreateNotificationDto dto)
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
                    
                    AppUser = _aUserService.GetUserById(dto.CreatedBy)
                    
                };

                var createdNoti = _service.CreateNotification(notificationEntity);
                if (dto.Files != null)
                {
                    var url = _service.UploadFileToCloudinary(dto.Files);
                    var files = _service.CreateFile(new ClassNotificationFile
                    {
                        NotificationId = createdNoti.Id,
                        FileName = dto.Files.FileName,
                        FileUrl = url.Result.ToString()
                    });
                }
                



                return Ok(new
                {
                    success = true,
                    message = "Tạo thông báo thành công.",
                    data = createdNoti
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Lỗi server: {ex.Message}",
                    error = ex.ToString()
                });
            }
        }


    }
}
