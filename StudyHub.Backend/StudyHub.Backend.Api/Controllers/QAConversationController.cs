using Microsoft.AspNetCore.Mvc;
using System.Linq;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Dtos.QADTOS;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Mappers;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
using StudyHub.Backend.Api.Hubs;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class QAConversationController : ControllerBase
    {
        private readonly QAConversationService _service;
        private readonly AppUserService _userService;
        private readonly AuthService _authService;
        private readonly QAConversationReadService _readService;

        public QAConversationController(QAConversationService service, AppUserService userService, AuthService authService, QAConversationReadService readService)
        {
            _service = service;
            _userService = userService;
            _authService = authService;
            _readService = readService;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            try
            {
                var list = _service.GetQAConversations();
                var dtos = list.Select(c => QAConversationMapper.MapToDto(c)).ToList();
                return Ok(new { Success = true, Message = "Lấy danh sách cuộc hội thoại thành công.", Data = dtos });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy danh sách cuộc hội thoại.", Data = (object?)null });
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetConversation(Guid id)
        {
            try
            {
                var conv = _service.GetQAConversationById(id);
                if (conv == null) return NotFound(new { Success = false, Message = "Conversation not found.", Data = (object?)null });
                return Ok(new { Success = true, Message = "Lấy conversation thành công.", Data = QAConversationMapper.MapToDto(conv) });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy conversation.", Data = (object?)null });
            }
        }

        [HttpPost]
        public IActionResult CreateConversation([FromBody] CreateQAConversationRequest req)
        {
            if (req == null) return BadRequest(new { Success = false, Message = "Request body is required.", Data = (object?)null });
            try
            {
                // default type to AI for now (service requires a type string)
                var created = _service.CreateQAConversation(req.Title, req.TopicId, req.TeacherId, "AI", req.IsPaid);
                if (created == null) return StatusCode(500, new { Success = false, Message = "Không tạo được conversation", Data = (object?)null });
                return CreatedAtAction(nameof(GetConversation), new { id = created.Id }, new { Success = true, Message = "Tạo conversation thành công.", Data = QAConversationMapper.MapToDto(created) });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi tạo conversation.", Data = (object?)null });
            }
        }

        [HttpGet("mine")]
        public IActionResult GetMine()
        {
            try
            {
                var list = _service.GetConversationsForCurrentUser();
                var dtos = list.Select(c => QAConversationMapper.MapToDto(c)).ToList();
                // attach unread counts per conversation for current user
                foreach (var d in dtos)
                {
                    try
                    {
                        d.UnreadCount = _readService.CountUnreadMessagesForCurrentUser(d.Id);
                    }
                    catch
                    {
                        d.UnreadCount = 0;
                    }
                }
                return Ok(new { Success = true, Message = "Lấy danh sách conversation của người dùng thành công.", Data = dtos });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy conversation của người dùng.", Data = (object?)null });
            }
        }

        [HttpGet("teachers")]
        public IActionResult GetAllQATeachers()
        {
            try
            {
                var teachers = _userService.GetQATeachers();
                return Ok(new { Success = true, Message = "Lấy danh sách QA teachers thành công.", Data = teachers });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy danh sách QA teachers.", Data = (object?)null });
            }
        }

        [HttpGet("teachers/with-conversations")]
        public IActionResult GetTeachersWithConversationsForCurrentStudent()
        {
            try
            {
                var current = _authService.GetCurrentUser();
                if (current == null) return Unauthorized(new { Success = false, Message = "Không có quyền", Data = (object?)null });

                var dtos = _service.GetTeachersWithConversationsForCurrentStudent();
                return Ok(new { Success = true, Message = "Lấy danh sách teachers có conversation với student thành công.", Data = dtos });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy danh sách teachers.", Data = (object?)null });
            }
        }

        [HttpGet("teachers/by-subject/{subjectId}")]
        public IActionResult GetQATeachersBySubject(short subjectId)
        {
            try
            {
                var teachers = _userService.GetQATeachersBySubject(subjectId);
                return Ok(new { Success = true, Message = "Lấy danh sách QA teachers theo môn thành công.", Data = teachers });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy danh sách QA teachers theo môn.", Data = (object?)null });
            }
        }

        [HttpGet("presence/online-count")]
        public IActionResult GetOnlineCount()
        {
            try
            {
                var count = PresenceTracker.GetOnlineCount();
                return Ok(new { Success = true, Message = "Số người online hiện tại.", Data = count });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy số người online.", Data = (object?)null });
            }
        }

        [HttpGet("presence/user/{userId}")]
        public IActionResult GetUserStatus(string userId)
        {
            try
            {
                var status = PresenceTracker.GetUserStatus(userId);
                return Ok(new { Success = true, Message = "Trạng thái người dùng.", Data = status });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy trạng thái người dùng.", Data = (object?)null });
            }
        }

        [HttpGet("teachers/online-exclude-connected")]
        public IActionResult GetOnlineTeachersExcludeConnected([FromQuery] string? excludeIds = null)
        {
            try
            {
                var exclude = (excludeIds ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                var list = PresenceTracker.GetOnlineTeachersExceptConnected(exclude);
                return Ok(new { Success = true, Message = "Danh sách giáo viên online không bao gồm đã kết nối.", Data = list });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy danh sách giáo viên.", Data = (object?)null });
            }
        }

        [HttpGet("students/with-conversations")]
        public IActionResult GetStudentsWithConversationsForCurrentTeacher()
        {
            try
            {
                var current = _authService.GetCurrentUser();
                if (current == null) return Unauthorized(new { Success = false, Message = "Không có quyền", Data = (object?)null });

                var dtos = _service.GetStudentsWithConversationsForCurrentTeacher();
                return Ok(new { Success = true, Message = "Lấy danh sách students có conversation với teacher thành công.", Data = dtos });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy danh sách students.", Data = (object?)null });
            }
        }

        [HttpPut("{id}")]
        public IActionResult UpdateConversation(Guid id, [FromBody] UpdateQAConversationRequest req)
        {
            if (req == null) return BadRequest(new { Success = false, Message = "Request body is required.", Data = (object?)null });
            try
            {
                var existing = _service.GetQAConversationById(id);
                if (existing == null) return NotFound(new { Success = false, Message = "Conversation not found.", Data = (object?)null });

                var updated = _service.UpdateQAConversation(id, req.Title, req.TopicId, req.TeacherId, null, req.IsPaid);
                if (updated == null) return StatusCode(500, new { Success = false, Message = "Không cập nhật được conversation", Data = (object?)null });
                return Ok(new { Success = true, Message = "Cập nhật conversation thành công.", Data = QAConversationMapper.MapToDto(updated) });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi cập nhật conversation.", Data = (object?)null });
            }
        }


    }
}
