using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using System;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StatisticsController : ControllerBase
    {
        private readonly StatisticsService _service;

        public StatisticsController(StatisticsService service)
        {
            _service = service;
        }

        [HttpGet("AccountsOverview")]
        public IActionResult AccountsOverview([FromQuery] string period = "day", [FromQuery] int range = 30)
        {
            try
            {
                var res = _service.GetAccountsOverview(period, range);
                return Ok(new { Success = true, Data = res });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lấy thống kê tài khoản thất bại", Error = ex.Message });
            }
        }

        [HttpGet("AccountRecovery")]
        public IActionResult AccountRecovery()
        {
            try
            {
                var res = _service.GetAccountRecoveryStats();
                return Ok(new { Success = true, Data = res });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lấy thống kê yêu cầu khôi phục thất bại", Error = ex.Message });
            }
        }
    }
}
