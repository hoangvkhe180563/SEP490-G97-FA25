using Microsoft.AspNetCore.Mvc;
using System.Linq;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Dtos.QADTOS;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Mappers;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class QAConversationController : ControllerBase
    {
        private readonly QAConversationService _service;
        private readonly AppUserService _userService;
        private readonly AuthService _authService;

        public QAConversationController(QAConversationService service, AppUserService userService, AuthService authService)
        {
            _service = service;
            _userService = userService;
            _authService = authService;
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
