using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Dtos.AppUserDTOS;
using StudyHub.Backend.Api.Dtos.AuthDTOS;
using StudyHub.Backend.Api.Filters;
using StudyHub.Backend.Api.Hubs;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Exceptions;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.UseCases.Utils;
using System;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AppUserController : ControllerBase
    {
        private readonly AppUserService _userService;
        private readonly AuthService _authService;
        private readonly AppRoleService _roleService;
        private readonly LocationService _locationService;
        private readonly IHubContext<NotificationHub> _notificationHub;
        private readonly NotificationService _notificationService;
        public AppUserController(AppUserService userService, AuthService authService, AppRoleService roleService, LocationService locationService,NotificationService notificationService, IHubContext<NotificationHub> notificationHub)
        {
            _userService = userService;
            _authService = authService;
            _roleService = roleService;
            _locationService = locationService;
            _notificationHub = notificationHub;
            _notificationService= notificationService;
        }

        // Export accounts to Excel
        [HttpGet("export")]
        public IActionResult Export()
        {
            try
            {
                var bytes = _userService.ExportAccountsToExcel();
                return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "accounts.xlsx");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Export failed", Error = ex.Message });
            }
        }

        // Export an Excel template for importing accounts
        [HttpGet("export-template")]
        public IActionResult ExportTemplate([FromQuery] int rows = 1000)
        {
            try
            {
                var bytes = _userService.ExportImportTemplate(rows);
                return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "accounts_import_template.xlsx");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Export template failed", Error = ex.Message });
            }
        }

        // Import accounts from Excel via multipart/form-data (IFormFile) - preferred for browser/FormData uploads
        [HttpPost("import")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Import([FromForm] ImportAccountsRequest req)
        {
            var file = req.FileName;
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { Success = false, Message = "File is required" });
                }

                byte[] bytes;
                using (var ms = new System.IO.MemoryStream())
                {
                    await file.CopyToAsync(ms);
                    bytes = ms.ToArray();
                }

                var res = _userService.ImportAccountsFromExcel(bytes, file.FileName);
                return Ok(new { Success = true, Data = res });
            }
            catch (InvalidImportFieldException ex)
            {
                // validation errors collected during import; return 400 with error dictionary
                return BadRequest(new { Success = false, Data = ex.Errors });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Import failed", Error = ex.Message });
            }
        }



        //[Authorize(Roles = "School Manager")]
        [HttpGet]
        public IActionResult Get([FromQuery] string? status, [FromQuery] string? role, [FromQuery] string? search, [FromQuery] int page, [FromQuery] int limit, [FromQuery] int? schoolId)
        {
            try
            {
                var result = _userService.GetAppUsers(status, role, search, page, limit, schoolId);
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

        // Get all teachers (standard teacher roles)
        [HttpGet("teachers")]
        public IActionResult GetTeachers()
        {
            try
            {
                var result = _userService.GetTeachers();
                if (result == null || !result.Any())
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy giáo viên" });
                }
                return Ok(new { Success = true, Data = result });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Tải danh sách giáo viên không thành công", Error = ex.Message });
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
                var city = _locationService.GetCityByCommuneId(user.CommuneId);

                var dto = AppUserMapper.ToAppUserDetail(user, roles, school?.Id, commune?.Id, city?.Id, school?.Name, commune?.Name, city?.Name);
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
                var user = await _userService.CreateAccountAsync(req.Email, req.Password, req.Username, req.RoleIds, req.CommuneId, req.SchoolId, req.Fullname, req.Dob, req.AvatarFile, req.Gender, req.Address, req.PhoneNumber, req.SubjectIds);

                // map to dto
                var roles = _roleService.GetRolesByUser(user.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
                var school = _locationService.GetSchoolById(user.SchoolId);
                var commune = _locationService.GetCommuneById(user.CommuneId);
                var city = _locationService.GetCityByCommuneId(user.CommuneId);

                var dto = AppUserMapper.ToAppUserDetail(user, roles, school?.Id, commune?.Id, city?.Id);
                try
                {
                    var title = "Tạo Tài Khoản";
                    var body = $"Bạn vừa tạo tài khoản {req.Username}.";
                    var link = "/user/accounts";
                    var currentUser = _authService.GetCurrentUser();

                    // send notification TO the currently logged-in user (fallback to new user if currentUser is null)
                    var recipientId = currentUser?.Id ?? user.Id;

                    var savedNotif = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                        title: title,
                        body: body,
                        targetType: "User",
                        targetGroupId: null,
                        targetUserId: recipientId,
                        recipientUserIds: new[] { recipientId },
                        createdBy: currentUser?.Id ?? user.Id,
                        linkUrl: link,
                        priority: "Normal",
                        ct: HttpContext.RequestAborted
                    );

                    // send real-time via SignalR (non-fatal)
                    try
                    {
                        var payload = new
                        {
                            id = savedNotif.Id,
                            title = savedNotif.Title,
                            body = savedNotif.Body,
                            linkUrl = link,
                            priority = savedNotif.Priority,
                            targetType = savedNotif.TargetType,
                            targetUserId = savedNotif.TargetUserId,
                            createdAt = savedNotif.CreatedAt,
                            createdBy = savedNotif.CreatedBy,
                            isRead = false
                        };

                        await _notificationHub.Clients.Group($"user_{recipientId}").SendAsync("NotificationCreated", payload, HttpContext.RequestAborted);
                    }
                    catch (Exception ex)
                    {
                        // non-fatal: log and continue
                        Console.WriteLine($"Broadcast create-account notification failed: {ex.Message}");
                    }
                }
                catch (Exception ex)
                {
                    // non-fatal: do not fail account creation because notification creation failed
                    Console.WriteLine($"Create/send create-account notification failed: {ex.Message}");
                }
                return Ok(new { Success = true, Data = dto });
            }
            catch (InvalidFieldException ex)
            {
                // business rule error (e.g., duplicate email/username)
                return BadRequest(new { Success = false, Message = ex.Errors });
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

                var user = await _userService.EditAccountAsync(id, req.Email, req.Username, req.Fullname, req.Dob, req.CommuneId, req.Status, req.AvatarFile, req.Gender, req.RoleIds, req.SchoolId, req.Address, req.PhoneNumber, req.SubjectIds);
                if (user == null) return NotFound(new { Success = false, Message = "Người dùng không tìm thấy" });

                var roles = _roleService.GetRolesByUser(user.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
                var school = _locationService.GetSchoolById(user.SchoolId);
                var commune = _locationService.GetCommuneById(user.CommuneId);
                var city = _locationService.GetCityByCommuneId(user.CommuneId);

                var dto = AppUserMapper.ToAppUserDetail(user, roles, school?.Id, commune?.Id, city?.Id);
                try
                {
                    var title = "Chỉnh Sửa Tài Khoản";
                    var body = $"Bạn vừa sửa thông tin tài khoản {req.Username}.";
                    var link = "/user/accounts";
                    var currentUser = _authService.GetCurrentUser();

                    // send notification TO the currently logged-in user (fallback to new user if currentUser is null)
                    var recipientId = currentUser?.Id ?? user.Id;

                    var savedNotif = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                        title: title,
                        body: body,
                        targetType: "User",
                        targetGroupId: null,
                        targetUserId: recipientId,
                        recipientUserIds: new[] { recipientId },
                        createdBy: currentUser?.Id ?? user.Id,
                        linkUrl: link,
                        priority: "Normal",
                        ct: HttpContext.RequestAborted
                    );

                    // send real-time via SignalR (non-fatal)
                    try
                    {
                        var payload = new
                        {
                            id = savedNotif.Id,
                            title = savedNotif.Title,
                            body = savedNotif.Body,
                            linkUrl = link,
                            priority = savedNotif.Priority,
                            targetType = savedNotif.TargetType,
                            targetUserId = savedNotif.TargetUserId,
                            createdAt = savedNotif.CreatedAt,
                            createdBy = savedNotif.CreatedBy,
                            isRead = false
                        };

                        await _notificationHub.Clients.Group($"user_{recipientId}").SendAsync("NotificationCreated", payload, HttpContext.RequestAborted);
                    }
                    catch (Exception ex)
                    {
                        // non-fatal: log and continue
                        Console.WriteLine($"Broadcast create-account notification failed: {ex.Message}");
                    }
                }
                catch (Exception ex)
                {
                    // non-fatal: do not fail account creation because notification creation failed
                    Console.WriteLine($"Create/send create-account notification failed: {ex.Message}");
                }
                return Ok(new { Success = true, Data = dto });
            }
            catch (InvalidFieldException ex)
            {
                // business rule error (e.g., duplicate email/username)
                return BadRequest(new { Success = false, Message = ex.Errors });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Tải dữ liệu người dùng không thành công", Error = ex.Message });
            }
        }

        [HttpPut("me")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateProfile([FromForm] UpdateProfileRequest req)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                var user = await _userService.UpdateProfile(currentUser, req.Email, req.Username, req.Fullname, req.Dob, req.CommuneId, req.OldPassword, req.NewPassword, req.AvatarFile, req.Gender, req.SchoolId, req.Address, req.PhoneNumber);
                if (user == null) return NotFound(new { Success = false, Message = "Người dùng không tìm thấy" });

                var roles = _roleService.GetRolesByUser(user.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
                var school = _locationService.GetSchoolById(user.SchoolId);
                var commune = _locationService.GetCommuneById(user.CommuneId);
                var city = _locationService.GetCityByCommuneId(user.CommuneId);

                var dto = AppUserMapper.ToAppUserDetail(user, roles, school?.Id, commune?.Id, city?.Id);
                try
                {
                    var title = "Cập nhật hồ sơ";
                    var body = "Thông tin cá nhân của bạn đã được cập nhật thành công.";
                    var link = "/user/profile"; // adjust if your app uses a different profile route

                    var savedNotif = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                        title: title,
                        body: body,
                        targetType: "User",
                        targetGroupId: null,
                        targetUserId: user.Id,
                        recipientUserIds: new[] { currentUser.Id },
                        createdBy: currentUser?.Id ?? user.Id,
                        linkUrl: link,
                        priority: "Normal",
                        ct: HttpContext.RequestAborted
                    );

                    // send real-time via SignalR (non-fatal)
                    try
                    {
                        var payload = new
                        {
                            id = savedNotif.Id,
                            title = savedNotif.Title,
                            body = savedNotif.Body,
                            linkUrl = link,
                            priority = savedNotif.Priority,
                            targetType = savedNotif.TargetType,
                            targetUserId = savedNotif.TargetUserId,
                            createdAt = savedNotif.CreatedAt,
                            createdBy = savedNotif.CreatedBy,
                            isRead = false
                        };

                        await _notificationHub.Clients.Group($"user_{user.Id}").SendAsync("NotificationCreated", payload, HttpContext.RequestAborted);
                    }
                    catch (Exception ex)
                    {
                        // non-fatal: log and continue
                        Console.WriteLine($"Broadcast personal profile-update notification failed: {ex.Message}");
                    }
                }
                catch (Exception ex)
                {
                    // non-fatal: do not fail profile update because notification creation failed
                    Console.WriteLine($"Create/send personal profile-update notification failed: {ex.Message}");
                }
                return Ok(new { Success = true, Data = dto });
            }
            catch (InvalidFieldException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Errors });
            }
            catch (InvalidOperationException ex)
            {
                // business rule error (e.g., duplicate email/username)
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Cập nhật thông tin cá nhân không thành công", Error = ex.Message });
            }
        }

        [HttpGet("me")]
        public IActionResult GetProfile()
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                var user = _userService.GetUserById(currentUser.Id);
                if (user == null) return NotFound(new { Success = false, Message = "Người dùng không tìm thấy" });
                var roles = _roleService.GetRolesByUser(user.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
                var school = _locationService.GetSchoolById(user.SchoolId);
                var commune = _locationService.GetCommuneById(user.CommuneId);
                var city = _locationService.GetCityByCommuneId(user.CommuneId);
                var dto = AppUserMapper.ToProfile(user, roles, school?.Id, commune?.Id, city?.Id, school?.Name, commune?.Name, city?.Name);
                return Ok(new { Success = true, Data = dto });
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
