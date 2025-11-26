using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.QADTOS;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QAConversationFileController : ControllerBase
    {
        private readonly QAConversationFileService _service;

        public QAConversationFileController(QAConversationFileService service)
        {
            _service = service;
        }

        [HttpGet("conversation/{conversationId}")]
        public IActionResult GetFilesByConversation(Guid conversationId)
        {
            var list = _service.GetByConversationId(conversationId);
            return Ok(new { Success = true, Message = "Lấy file thành công.", Data = list });
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public IActionResult Upload([FromForm] FileConversationRequest fileConversationRequest)
        {
            if (fileConversationRequest.File == null) return BadRequest(new { Success = false, Message = "Vui lòng gửi file." });

            var created = _service.UploadFile(fileConversationRequest.ConversationId, fileConversationRequest.File);
            if (created == null) return StatusCode(500, new { Success = false, Message = "Upload thất bại." });

            return CreatedAtAction(nameof(GetFilesByConversation), new { conversationId = created.Id }, new { Success = true, Message = "Upload thành công.", Data = created });
        }
    }
}
