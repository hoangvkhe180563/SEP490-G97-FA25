using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.ClassDTOS;
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
        private readonly LocationService _locationService;
        private readonly SmtpEmailService _emailService;
        private readonly IConfiguration _config;
        public ClassMemberController(ClassMemberService service, AppUserService aUserService, AppRoleService aRoleService, LocationService locationService, SmtpEmailService emailService, IConfiguration config, ClassService classService)
        {
            _service = service;
            _aUserService = aUserService;
            _aRoleService = aRoleService;
            _locationService = locationService;
            _emailService = emailService;
            _config = config;
            _classService = classService;
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
                     var school = (user?.SchoolId).HasValue ? _locationService.GetSchoolById(user!.SchoolId.Value) : null;
                     var commune = (user?.CommuneId).HasValue ? _locationService.GetCommuneById(user!.CommuneId.Value) : null;
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

            var baseFrontendUrl = _config["App:BaseUrl"]?.TrimEnd('/') ?? $"{Request.Scheme}://{Request.Host}";

            var results = await _service.InviteByEmailsAsync(classId, request.Emails, request.Role, request.Message, baseFrontendUrl);
            return Ok(new { success = true, message = "Đã gửi lời mời.", data = results });
        }

        [HttpPost("{userId}/confirm")]
        public IActionResult Confirm(int classId, string userId)
        {
            var ok = _service.ConfirmMemberFromString(classId, userId);
            if (ok == null) return BadRequest(new { success = false, message = "UserId không hợp lệ." });
            if (ok == false) return StatusCode(500, new { success = false, message = "Không thể xác nhận thành viên." });
            return Ok(new { success = true, message = "Thành viên đã được xác nhận (joined)." });
        }

        [HttpPost("{userId}/kick")]
        public IActionResult Kick(int classId, string userId)
        {
            var ok = _service.KickMemberFromString(classId, userId);
            if (ok == null) return BadRequest(new { success = false, message = "UserId không hợp lệ." });
            if (ok == false) return StatusCode(500, new { success = false, message = "Không thể kick thành viên." });
            return Ok(new { success = true, message = "Thành viên đã bị kick (status set to kicked)." });
        }
    }
}
