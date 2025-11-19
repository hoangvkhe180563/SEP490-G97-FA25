using Microsoft.AspNetCore.Mvc;
using System.Linq;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.UseCases.Utils;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.UseCases.Exceptions;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountRecoveryController : ControllerBase
    {
        private readonly AccountRecoveryService _service;
        private readonly AppUserService _userService;

        public AccountRecoveryController(AccountRecoveryService service, AppUserService userService)
        {
            _service = service;
            _userService = userService;
        }

        [HttpPost]
        public IActionResult Create([FromBody] CreateAccountRecoveryRequest req)
        {
            try
            {
                if (req == null || string.IsNullOrWhiteSpace(req.Identifier))
                    return BadRequest(new { Success = false, Message = "Thông tin tài khoản cần được điền" });

                // try find user by email or username
                var user = _userService.GetUserByEmail(req.Identifier) ?? _userService.GetUserByUsername(req.Identifier);
                if (user == null) return NotFound(new { Success = false, Message = "Người dùng không tìm thấy" });

                _service.CreateRequest(user.Id, req.Reason ?? "");
                return Ok(new { Success = true, Message = "Yêu cầu khôi phục đã được gửi" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Gửi yêu cầu không thành công", Error = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult Search([FromQuery] string? search, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            try
            {
                var res = _service.SearchRequests(search, status, page, limit);
                // map to DTO
                var items = res.Items.Select(i => new AccountRecoveryListItemDto
                {
                    Id = i.Id,
                    UserId = i.UserId,
                    Username = i.User?.Username,
                    Email = i.User?.Email,
                    RequestReason = i.RequestReason,
                    Status = i.Status,
                    CreatedAt = i.CreatedAt,
                    ProcessedAt = i.ProcessedAt,
                    ProcessedBy = i.ProcessedBy
                }).ToList();

                var dto = new StudyHub.Backend.UseCases.Dtos.PagedResult<AccountRecoveryListItemDto>
                {
                    Items = items,
                    Total = res.Total,
                    Page = res.Page,
                    Limit = res.Limit,
                    TotalPages = res.TotalPages
                };

                return Ok(new { Success = true, Data = dto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lấy danh sách yêu cầu thất bại", Error = ex.Message });
            }
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> SetStatus(Guid id, [FromBody] SetRecoveryStatusRequest req)
        {
            try
            {
                if (req == null || string.IsNullOrEmpty(req.Status)) return BadRequest(new { Success = false, Message = "Trạng thái được yêu cầu" });
                // processedBy: if user is authenticated, use current user, otherwise null
                Guid processedBy = Guid.Empty;
                try
                {
                    var current = HttpContext.Items["CurrentUser"] as StudyHub.Backend.Domain.Entities.AppUser;
                    if (current != null) processedBy = current.Id;
                }
                catch { }

                // if approved, apply to user
                bool applyToUser = req.Status.Equals("Đã phê duyệt", StringComparison.OrdinalIgnoreCase) || req.Status.Equals("Approved", StringComparison.OrdinalIgnoreCase);
                await _service.UpdateStatus(id, req.Status, processedBy, applyToUser);
                return Ok(new { Success = true, Message = "Cập nhật trạng thái thành công" });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Cập nhật trạng thái thất bại", Error = ex.Message });
            }
        }
    }
}
