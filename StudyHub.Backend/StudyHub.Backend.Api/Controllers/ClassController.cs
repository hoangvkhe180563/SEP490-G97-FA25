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
        //[HttpGet("{id}/detail")]
        //public IActionResult GetClassDetail(int id)
        //{
        //    var cls = _service.GetClassById(id);
        //    if (cls == null)
        //        return NotFound(new { success = false, message = "Không tìm thấy lớp học." });

        // Lấy dữ liệu phụ trực tiếp từ repository
        //var members = _service.GetClassMembers(id)
        //.Select(m =>
        //{
        //    var roles = _aRoleService.GetRolesByUser(m.UserId).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
        //    return m.ToMemberDto(_aUserService.GetUserById(m.UserId), roles);
        //})
        //.ToList();

        //    var notifications = _service.GetClassNotifications(id)
        //        .Select(n => n.ToNotificationDto())
        //        .ToList();

        //    var dto = cls.ToFullDetailDto(members, notifications);

        //    return Ok(new
        //    {
        //        success = true,
        //        message = "Lấy thông tin lớp học thành công.",
        //        data = dto
        //    });
        //}
    }
}
