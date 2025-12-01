using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.UseCases.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using StudyHub.Backend.Api.Hubs;

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

        // Group 1 - Accounts overview (includes retention and average login frequency)
        [HttpGet("AccountsOverview")]
        public IActionResult AccountsOverview(
            [FromQuery] string period = "day",
            [FromQuery] int range = 30,
            [FromQuery] DateTime? retentionStart = null,
            [FromQuery] DateTime? retentionEnd = null,
            [FromQuery] int retentionReturnAfterDays = 1,
            [FromQuery] DateTime? avgLoginStart = null,
            [FromQuery] DateTime? avgLoginEnd = null)
        {
            try
            {
                var accounts = _service.GetAccountsOverview(period, range);

                var rStart = retentionStart ?? DateTime.Now.AddDays(-30);
                var rEnd = retentionEnd ?? DateTime.Now;
                var retention = _service.GetRetention(rStart, rEnd, retentionReturnAfterDays);

                var aStart = avgLoginStart ?? DateTime.Now.AddDays(-30);
                var aEnd = avgLoginEnd ?? DateTime.Now;
                var avgLogin = _service.GetAverageLoginFrequency(aStart, aEnd);

                return Ok(new { Success = true, Data = new { Accounts = accounts, Retention = retention, AverageLogin = avgLogin } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lấy thống kê tài khoản thất bại", Error = ex.Message });
            }
        }



        // Group 2 - Access behavior: peak hours, DAU, MAU
        [HttpGet("AccessBehavior")]
        public IActionResult AccessBehavior([FromQuery] DateTime? start, [FromQuery] DateTime? end, [FromQuery] int top = 5, [FromQuery] int page = 1, [FromQuery] int pageSize = 100)
        {
            try
            {
                var s = start;
                var e = end;
                var peak = _service.GetPeakHours(s, e, top);
                var dau = _service.GetDAU(s ?? DateTime.Now.AddDays(-7), e ?? DateTime.Now, page, pageSize);
                var mau = _service.GetMAU(s ?? DateTime.Now.AddMonths(-6), e ?? DateTime.Now, page, pageSize);
                return Ok(new { Success = true, Data = new { PeakHours = peak, DAU = dau, MAU = mau } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lấy thống kê hành vi truy cập thất bại", Error = ex.Message });
            }
        }

        // Group 3 - Account recovery stats
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

        // Group 4 - Real-time statistics using PresenceTracker
        [HttpGet("Realtime")]
        public IActionResult Realtime()
        {
            try
            {
                var onlineCount = PresenceTracker.GetOnlineCount();
                var onlineUsers = PresenceTracker.GetOnlineUsersSummary();
                var roleCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                foreach (dynamic u in onlineUsers)
                {
                    var roles = (IEnumerable<string>?)u.Roles;
                    if (roles == null) continue;
                    foreach (var r in roles)
                    {
                        if (string.IsNullOrEmpty(r)) continue;
                        if (!roleCounts.ContainsKey(r)) roleCounts[r] = 0;
                        roleCounts[r]++;
                    }
                }

                var rolePercent = roleCounts.Select(kv => new { Role = kv.Key, Count = kv.Value, Percentage = onlineCount == 0 ? 0 : (double)kv.Value / onlineCount * 100.0 }).ToList();

                return Ok(new { Success = true, Data = new { OnlineCount = onlineCount, RoleBreakdown = rolePercent } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lấy realtime stats thất bại", Error = ex.Message });
            }
        }

        // Group 5 - LLM history statistics
        [HttpGet("Llm/QuestionsByStudent")]
        public IActionResult LlmQuestionsByStudent([FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null, [FromQuery] int top = 100)
        {
            try
            {
                var res = _service.GetLlmQuestionsByStudent(start, end, top);
                return Ok(new { Success = true, Data = res });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lấy thống kê câu hỏi theo học sinh thất bại", Error = ex.Message });
            }
        }

        [HttpGet("Llm/QuestionsTimeSeries")]
        public IActionResult LlmQuestionsTimeSeries([FromQuery] string period = "day", [FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null)
        {
            try
            {
                var s = start ?? DateTime.Now.AddDays(-30);
                var e = end ?? DateTime.Now;
                var res = _service.GetLlmQuestionsTimeSeries(period, s, e);
                return Ok(new { Success = true, Data = res });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lấy chuỗi thời gian câu hỏi LLM thất bại", Error = ex.Message });
            }
        }

        [HttpGet("Llm/PeakHours")]
        public IActionResult LlmPeakHours([FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null, [FromQuery] int top = 5)
        {
            try
            {
                var res = _service.GetLlmPeakHours(start, end, top);
                return Ok(new { Success = true, Data = res });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lấy giờ cao điểm LLM thất bại", Error = ex.Message });
            }
        }

        [HttpGet("Llm/TopSubjects")]
        public IActionResult LlmTopSubjects([FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null, [FromQuery] int top = 10)
        {
            try
            {
                var res = _service.GetTopSubjects(start, end, top);
                return Ok(new { Success = true, Data = res });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lấy môn học được hỏi nhiều nhất thất bại", Error = ex.Message });
            }
        }

        [HttpGet("Llm/TokenSummary")]
        public IActionResult LlmTokenSummary([FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null)
        {
            try
            {
                var res = _service.GetTokenSummary(start, end);
                return Ok(new { Success = true, Data = res });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lấy thống kê token thất bại", Error = ex.Message });
            }
        }

        [HttpGet("Llm/TokenByPeriod")]
        public IActionResult LlmTokenByPeriod([FromQuery] string period = "month", [FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null)
        {
            try
            {
                var res = _service.GetTokenByPeriod(period, start, end);
                return Ok(new { Success = true, Data = res });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lấy token theo khoảng thời gian (day/week/month) thất bại", Error = ex.Message });
            }
        }

        [HttpGet("Llm/TopTokenUsers")]
        public IActionResult LlmTopTokenUsers([FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null, [FromQuery] int top = 10)
        {
            try
            {
                var res = _service.GetTopTokenUsers(start, end, top);
                return Ok(new { Success = true, Data = res });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lấy người dùng tốn token nhất thất bại", Error = ex.Message });
            }
        }
    }
}
