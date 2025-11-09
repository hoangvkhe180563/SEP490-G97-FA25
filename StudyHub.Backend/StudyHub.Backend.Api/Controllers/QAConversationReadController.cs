using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Dtos.QADTOS;
using System;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class QAConversationReadController : ControllerBase
    {
        private readonly QAConversationReadService _service;

        public QAConversationReadController(QAConversationReadService service)
        {
            _service = service;
        }

        [HttpGet("conversation/{conversationId}")]
        public IActionResult GetByConversation(Guid conversationId)
        {
            try
            {
                var list = _service.GetReadsByConversationId(conversationId);
                return Ok(new { Success = true, Message = "Lấy reads theo conversation thành công.", Data = list });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy reads theo conversation.", Data = (object?)null });
            }
        }

        [HttpGet("user/{userId}")]
        public IActionResult GetByUser(Guid userId)
        {
            try
            {
                var list = _service.GetReadsByUserId(userId);
                return Ok(new { Success = true, Message = "Lấy reads theo user thành công.", Data = list });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy reads theo user.", Data = (object?)null });
            }
        }

        [HttpGet("user/{userId}/conversation/{conversationId}")]
        public IActionResult GetByUserAndConversation(Guid userId, Guid conversationId)
        {
            try
            {
                var item = _service.GetReadByUserAndConversation(userId, conversationId);
                if (item == null) return NotFound(new { Success = false, Message = "Read not found.", Data = (object?)null });
                return Ok(new { Success = true, Message = "Lấy read thành công.", Data = item });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy read.", Data = (object?)null });
            }
        }

        [HttpGet("count/user/{userId}/conversation/{conversationId}")]
        public IActionResult CountByUserAndConversation(Guid userId, Guid conversationId)
        {
            try
            {
                var count = _service.CountReadByUserAndConversation(userId, conversationId);
                return Ok(new { Success = true, Message = "Đếm read thành công.", Data = count });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi đếm read.", Data = (object?)null });
            }
        }

        [HttpGet("unread/user/{userId}/conversation/{conversationId}")]
        public IActionResult CountUnreadByUserAndConversation(Guid userId, Guid conversationId)
        {
            try
            {
                var count = _service.CountUnreadMessagesForUser(conversationId, userId);
                return Ok(new { Success = true, Message = "Đếm unread messages thành công.", Data = count });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi đếm unread messages.", Data = (object?)null });
            }
        }

        [HttpGet("unread/conversation/{conversationId}")]
        public IActionResult CountUnreadForCurrentUser(Guid conversationId)
        {
            try
            {
                var count = _service.CountUnreadMessagesForCurrentUser(conversationId);
                return Ok(new { Success = true, Message = "Đếm unread messages cho user hiện tại thành công.", Data = count });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi đếm unread messages cho user hiện tại.", Data = (object?)null });
            }
        }

        [HttpPut("mark-read")]
        public IActionResult MarkRead([FromBody] UpdateQAConversationReadRequest req)
        {
            if (req == null) return BadRequest(new { Success = false, Message = "Request body is required.", Data = (object?)null });
            try
            {
                var updated = _service.UpsertRead(req.ConversationId, req.UserId);
                if (updated == null) return StatusCode(500, new { Success = false, Message = "Không cập nhật được read.", Data = (object?)null });
                return Ok(new { Success = true, Message = "Cập nhật read thành công.", Data = updated });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi cập nhật read.", Data = (object?)null });
            }
        }
    }
}
