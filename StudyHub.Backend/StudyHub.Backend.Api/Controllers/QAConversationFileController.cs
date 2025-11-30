using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.QADTOS;
using StudyHub.Backend.UseCases.Services;
using Microsoft.AspNetCore.SignalR;

namespace StudyHub.Backend.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QAConversationFileController : ControllerBase
    {
        private readonly QAConversationFileService _service;
        private readonly Microsoft.AspNetCore.SignalR.IHubContext<StudyHub.Backend.Api.Hubs.QAChatHub> _chatHub;
        private readonly Microsoft.Extensions.Logging.ILogger<QAConversationFileController> _logger;

        public QAConversationFileController(QAConversationFileService service, Microsoft.AspNetCore.SignalR.IHubContext<StudyHub.Backend.Api.Hubs.QAChatHub> chatHub, Microsoft.Extensions.Logging.ILogger<QAConversationFileController> logger)
        {
            _service = service;
            _chatHub = chatHub;
            _logger = logger;
        }

        [HttpGet("conversation/{conversationId}")]
        public IActionResult GetFilesByConversation(Guid conversationId)
        {
            _logger.LogInformation("GetFilesByConversation called for {ConversationId}", conversationId);
            var list = _service.GetByConversationId(conversationId);
            _logger.LogInformation("GetFilesByConversation returning {Count} files for {ConversationId}", list?.Count ?? 0, conversationId);
            return Ok(new { Success = true, Message = "Lấy file thành công.", Data = list });
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Upload([FromForm] FileConversationRequest fileConversationRequest)
        {
            if (fileConversationRequest.File == null) return BadRequest(new { Success = false, Message = "Vui lòng gửi file." });

            var created = _service.UploadFile(fileConversationRequest.ConversationId, fileConversationRequest.File);
            if (created == null) return StatusCode(500, new { Success = false, Message = "Upload thất bại." });

            // broadcast to conversation group so other connected clients receive the new file
            try
            {
                var dto = Mappers.QAConversationFileMapper.MapToDto(created);
                var group = $"conversation-{created.ConversationId}";
                // fire-and-forget
                await _chatHub.Clients.Group(group).SendAsync("ReceiveFile", dto);
                _logger.LogInformation("Broadcasted ReceiveFile for {FileId} to group {Group}", created.Id, group);
            }
            catch
            {
                // ignore hub failures
            }

            return CreatedAtAction(nameof(GetFilesByConversation), new { conversationId = created.ConversationId }, new { Success = true, Message = "Upload thành công.", Data = created });
        }
    }
}
