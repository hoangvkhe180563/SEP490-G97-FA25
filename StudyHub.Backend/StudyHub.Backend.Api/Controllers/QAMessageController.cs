using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using Microsoft.AspNetCore.SignalR;
using StudyHub.Backend.Api.Hubs;
using StudyHub.Backend.Api.Dtos.QADTOS;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Mappers;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class QAMessageController : ControllerBase
    {
        private readonly QAMessageService _service;
        private readonly IHubContext<QAChatHub> _chatHub;

        public QAMessageController(QAMessageService service, IHubContext<QAChatHub> chatHub)
        {
            _service = service;
            _chatHub = chatHub;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            try
            {
                var list = _service.GetQAMessages();
                var dtos = list.Select(m => QAMessageMapper.MapToDto(m)).ToList();
                return Ok(new { Success = true, Message = "Lấy danh sách messages thành công.", Data = dtos });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy tin nhắn.", Data = (object?)null });
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetQAMessage(Guid id)
        {
            try
            {
                var msg = _service.GetQAMessageById(id);
                if (msg == null) return NotFound(new { Success = false, Message = "Message not found.", Data = (object?)null });
                return Ok(new { Success = true, Message = "Lấy message thành công.", Data = QAMessageMapper.MapToDto(msg) });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy message.", Data = (object?)null });
            }
        }

        [HttpGet("conversation/{conversationId}")]
        public IActionResult GetByConversation(Guid conversationId)
        {
            try
            {
                var list = _service.GetQAMessagesByConversationId(conversationId);
                var dtos = list.Select(m => QAMessageMapper.MapToDto(m)).ToList();
                return Ok(new { Success = true, Message = "Lấy messages theo conversation thành công.", Data = dtos });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy messages theo conversation.", Data = (object?)null });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateMessage([FromBody] CreateQAMessageRequest req)
        {
            if (req == null) return BadRequest(new { Success = false, Message = "Request body is required.", Data = (object?)null });
            try
            {
                // Service will determine the sender from auth; ignore req.SenderId for security
                var created = _service.CreateQAMessage(req.ConversationId, req.Content, req.IsFromAi, req.IsPaid);
                if (created == null) return StatusCode(500, new { Success = false, Message = "Không tạo được message", Data = (object?)null });
                // broadcast to conversation group so connected clients receive the new message in real-time
                try
                {
                    var dto = QAMessageMapper.MapToDto(created);
                    await _chatHub.Clients.Group($"conversation-{created.Conversation.Id}").SendAsync("ReceiveMessage", dto);
                }
                catch
                {
                    // if hub broadcast fails, don't fail the request
                }
                return CreatedAtAction(nameof(GetQAMessage), new { id = created.Id }, new { Success = true, Message = "Tạo message thành công.", Data = QAMessageMapper.MapToDto(created) });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi tạo message.", Data = (object?)null });
            }
        }

        [HttpPut("{id}")]
        public IActionResult UpdateMessage(Guid id, [FromBody] UpdateQAMessageRequest req)
        {
            if (req == null) return BadRequest(new { Success = false, Message = "Request body is required.", Data = (object?)null });
            try
            {
                var updated = _service.UpdateQAMessage(id, req.ConversationId, req.Content, req.IsFromAi, req.IsPaid);
                if (updated == null) return NotFound(new { Success = false, Message = "Message not found.", Data = (object?)null });
                return Ok(new { Success = true, Message = "Cập nhật message thành công.", Data = QAMessageMapper.MapToDto(updated) });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi cập nhật message.", Data = (object?)null });
            }
        }


    }
}
