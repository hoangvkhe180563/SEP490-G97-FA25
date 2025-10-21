using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Dtos.AppUserDTOS;
using StudyHub.Backend.Api.Dtos.AuthDTOS; 
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.UseCases.Services;
using Microsoft.AspNetCore.Authorization;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AppUserController : ControllerBase
    {
        private readonly AppUserService _userService;
        private readonly AppRoleService _roleService;
        private readonly IConfiguration _configuration;

        public AppUserController(AppUserService userService, AppRoleService roleService, IConfiguration configuration)
        {
            _userService = userService;
            _roleService = roleService;
            _configuration = configuration;
        }

        [Authorize(Roles = "Student")]
        [HttpGet]
        public IActionResult Get([FromQuery] string? status, [FromQuery] string? role, [FromQuery] string? search, [FromQuery] int page, [FromQuery] int limit)
        {
            try
            {
                var result = _userService.GetAppUsers(status, role, search, page, limit);
                var response = AppUserMapper.ToAppUserList(result);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = "false", Message = "Tải dữ liệu người dùng không thành công", Error = ex.Message });
            }
        }

        // Admin: get account detail
        [HttpGet("{id}")]
        public IActionResult GetById(Guid id)
        {
            try
            {
                var user = _userService.GetUserById(id);
                if (user == null) return NotFound(new { Success = "false", Message = "Người dùng không tìm thấy" });

                // load roles and names for mapping
                var roles = _roleService.GetRolesByUser(user.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
                var schoolName = _userService._userRepository.GetSchoolName(user.SchoolId);
                var communeName = _userService._userRepository.GetCommuneName(user.CommuneId);
                var (provinceName, cityName) = _userService._userRepository.GetProvinceAndCityNamesByCommuneId(user.CommuneId);

                var dto = AppUserMapper.ToAppUserDetail(user, roles, schoolName, communeName, cityName, provinceName);
                return Ok(new { Success = "true", Data = dto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = "false", Message = "Tải dữ liệu người dùng không thành công", Error = ex.Message });
            }
        }

        // Admin: create account
        [HttpPost("create")]
        public IActionResult Create([FromBody] CreateAccountRequest req)
        {
            try
            {
                var user = _userService.CreateAccount(req.Email, req.Password, req.Username, req.RoleIds, req.CommuneId, req.Fullname, req.Avatar, req.Gender);

                // map to dto
                var roles = _roleService.GetRolesByUser(user.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
                var schoolName = _userService._userRepository.GetSchoolName(user.SchoolId);
                var communeName = _userService._userRepository.GetCommuneName(user.CommuneId);
                var (provinceNameCreate, cityNameCreate) = _userService._userRepository.GetProvinceAndCityNamesByCommuneId(user.CommuneId);
                var dto = AppUserMapper.ToAppUserDetail(user, roles, schoolName, communeName, cityNameCreate, provinceNameCreate);

                return Ok(new { Success = "true", Data = dto });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = "false", Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = "false", Message = "Tải dữ liệu người dùng không thành công", Error = ex.Message });
            }
        }

        // Admin: edit account
        [HttpPut("{id}")]
        public IActionResult Edit(Guid id, [FromBody] EditAccountRequest req)
        {
            try
            {
                var user = _userService.EditAccount(id, req.Email, req.Username, req.Fullname, req.CommuneId, req.Status, req.Avatar, req.Gender, req.RoleIds);
                if (user == null) return NotFound(new { Success = "false", Message = "Người dùng không tìm thấy" });

                var roles = _roleService.GetRolesByUser(user.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
                var schoolName = _userService._userRepository.GetSchoolName(user.SchoolId);
                var communeName = _userService._userRepository.GetCommuneName(user.CommuneId);
                (string? provinceNameEdit, string? cityNameEdit) = _userService._userRepository.GetProvinceAndCityNamesByCommuneId(user.CommuneId);
                var dto = AppUserMapper.ToAppUserDetail(user, roles, schoolName, communeName, cityNameEdit, provinceNameEdit);

                return Ok(new { Success = "true", Data = dto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = "false", Message = "Tải dữ liệu người dùng không thành công", Error = ex.Message });
            }
        }

        // Admin: deactivate account (set status to false)
        [HttpPatch("{id}/deactivate")]
        public IActionResult Deactivate(Guid id)
        {
            try
            {
                var ok = _userService.DeactivateAccount(id);
                if (!ok) return NotFound(new { Success = "false", Message = "Tài khoản người dùng không tìm thấy" });
                return Ok(new { Success = "true", Message = "Tài khoản đã bị vô hiệu hoá" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = "false", Message = "Tải dữ liệu người dùng không thành công", Error = ex.Message });
            }
        }

        [HttpPatch("{id}/activate")]
        public IActionResult Activate(Guid id)
        {
            try
            {
                var ok = _userService.ActivateAccount(id);
                if (!ok) return NotFound(new { Success = "false", Message = "Tài khoản người dùng không tìm thấy" });
                return Ok(new { Success = "true", Message = "Tài khoản đã bị vô hiệu hoá" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = "false", Message = "Tải dữ liệu người dùng không thành công", Error = ex.Message });
            }
        }

    }
}
