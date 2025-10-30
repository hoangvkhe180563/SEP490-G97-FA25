using Microsoft.AspNetCore.Mvc;
using System;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Dtos.AppUserDTOS;
using StudyHub.Backend.Api.Dtos.AuthDTOS;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.UseCases.Utils;
using Microsoft.AspNetCore.Authorization;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AppUserController : ControllerBase
    {
        private readonly AppUserService _userService;
        private readonly AppRoleService _roleService;
        private readonly LocationService _locationService;

        public AppUserController(AppUserService userService, AppRoleService roleService, LocationService locationService)
        {
            _userService = userService;
            _roleService = roleService;
            _locationService = locationService;
        }

        //[Authorize(Roles = "School Manager")]
        [HttpGet]
        public IActionResult Get([FromQuery] string? status, [FromQuery] string? role, [FromQuery] string? search, [FromQuery] int page, [FromQuery] int limit)
        {
            try
            {
                var result = _userService.GetAppUsers(status, role, search, page, limit);
                if (result == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy người dùng" });
                }
                var response = AppUserMapper.ToAppUserList(result);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                // business rule / validation error from service (e.g., duplicate email/username)
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Cập nhật người dùng không thành công", Error = ex.Message });
            }
        }

        // Admin: get account detail
        //[Authorize(Roles = "School Manager")]
        [HttpGet("{id}")]
        public IActionResult GetById(Guid id)
        {
            try
            {
                var user = _userService.GetUserById(id);
                if (user == null) return NotFound(new { Success = false, Message = "Người dùng không tìm thấy" });

                // load roles and names for mapping
                var roles = _roleService.GetRolesByUser(user.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
                var school = _locationService.GetSchoolById(user.SchoolId);
                var commune = _locationService.GetCommuneById(user.CommuneId);
                var (province, city) = _locationService.GetProvinceAndCityByCommuneId(user.CommuneId);

                var dto = AppUserMapper.ToAppUserDetail(user, roles, school?.Id, commune?.Id, city?.Id, province?.Id);
                return Ok(new { Success = true, Data = dto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Tải dữ liệu người dùng không thành công", Error = ex.Message });
            }
        }

        // Admin: create account
        //[Authorize(Roles = "School Manager")]
        [HttpPost("create")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create([FromForm] CreateAccountRequest req)
        {
            try
            {
                var user = await _userService.CreateAccountAsync(req.Email, req.Password, req.Username, req.RoleIds, req.CommuneId, req.SchoolId, req.Fullname, req.AvatarFile, req.Gender);

                // map to dto
                var roles = _roleService.GetRolesByUser(user.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
                var school = _locationService.GetSchoolById(user.SchoolId);
                var commune = _locationService.GetCommuneById(user.CommuneId);
                var (province, city) = _locationService.GetProvinceAndCityByCommuneId(user.CommuneId);

                var dto = AppUserMapper.ToAppUserDetail(user, roles, school?.Id, commune?.Id, city?.Id, province?.Id);

                return Ok(new { Success = true, Data = dto });
            }
            catch (InvalidOperationException ex)
            {
                // business rule error (e.g., duplicate email/username)
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Tạo tài khoản không thành công", Error = ex.Message });
            }
        }

        // Admin: edit account
        //[Authorize(Roles = "School Manager")]
        [HttpPut("{id}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Edit(Guid id, [FromForm] EditAccountRequest req)
        {
            try
            {

                var user = await _userService.EditAccountAsync(id, req.Email, req.Username, req.Fullname, req.CommuneId, req.Status, req.AvatarFile, req.Gender, req.RoleIds, req.SchoolId);
                if (user == null) return NotFound(new { Success = false, Message = "Người dùng không tìm thấy" });

                var roles = _roleService.GetRolesByUser(user.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
                var school = _locationService.GetSchoolById(user.SchoolId);
                var commune = _locationService.GetCommuneById(user.CommuneId);
                var (province, city) = _locationService.GetProvinceAndCityByCommuneId(user.CommuneId);

                var dto = AppUserMapper.ToAppUserDetail(user, roles, school?.Id, commune?.Id, city?.Id, province?.Id);

                return Ok(new { Success = true, Data = dto });
            }catch (InvalidOperationException ex){
                // business rule error (e.g., duplicate email/username)
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Tải dữ liệu người dùng không thành công", Error = ex.Message });
            }
        }

        // Admin: deactivate account (set status to false)
        //[Authorize(Roles = "School Manager")]
        [HttpPatch("{id}/deactivate")]
        public IActionResult Deactivate(Guid id)
        {
            try
            {
                var ok = _userService.DeactivateAccount(id);
                if (!ok) return NotFound(new { Success = false, Message = "Tài khoản người dùng không tìm thấy" });
                return Ok(new { Success = true, Message = "Tài khoản đã bị vô hiệu hoá" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Tải dữ liệu người dùng không thành công", Error = ex.Message });
            }
        }

        //[Authorize(Roles = "School Manager")]
        [HttpPatch("{id}/activate")]
        public IActionResult Activate(Guid id)
        {
            try
            {
                var ok = _userService.ActivateAccount(id);
                if (!ok) return NotFound(new { Success = false, Message = "Tài khoản người dùng không tìm thấy" });
                return Ok(new { Success = true, Message = "Tài khoản đã bị vô hiệu hoá" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Tải dữ liệu người dùng không thành công", Error = ex.Message });
            }
        }

        // Admin: set status (Active / Inactive)
        public class SetStatusRequest
        {
            public string? Status { get; set; }
        }

        //[Authorize(Roles = "School Manager")]
        [HttpPatch("{id}/status")]
        public IActionResult SetStatus(Guid id, [FromBody] SetStatusRequest req)
        {
            try
            {
                if (req == null || string.IsNullOrEmpty(req.Status))
                {
                    return BadRequest(new { Success = false, Message = "Status is required" });
                }

                bool ok;
                if (req.Status.Equals("Active", StringComparison.OrdinalIgnoreCase))
                {
                    ok = _userService.ActivateAccount(id);
                }
                else
                {
                    ok = _userService.DeactivateAccount(id);
                }

                if (!ok) return NotFound(new { Success = false, Message = "Tài khoản người dùng không tìm thấy" });

                return Ok(new { Success = true, Message = "Cập nhật trạng thái thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Cập nhật trạng thái không thành công", Error = ex.Message });
            }
        }

    }
}
