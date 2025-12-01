using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Dtos.RecommendDTOS;
using System.Linq;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LlmHistoryController : ControllerBase
    {
        private readonly LlmHistoryService _service;

        public LlmHistoryController(LlmHistoryService service)
        {
            _service = service;
        }

        [HttpPost]
        public IActionResult Create([FromBody] CreateLlmHistoryRequest req)
        {
            if (req == null) return BadRequest(new { Success = false, Message = "Request body is required.", Data = (object?)null });
            try
            {
                var created = _service.CreateEntry(req.InputText);
                var dto = new LlmHistoryResponseDto { Id = created.Id, InputText = created.InputText, Llmresponse = created.Llmresponse, CreatedAt = created.CreatedAt };
                return CreatedAtAction(nameof(GetById), new { id = dto.Id }, new { Success = true, Message = "Tạo lịch sử LLM thành công.", Data = dto });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message, Data = (object?)null });
            }
        }

        [HttpPut("{id}/response")]
        public IActionResult UpdateResponse(int id, [FromBody] UpdateLlmHistoryResponseRequest req)
        {
            if (req == null) return BadRequest(new { Success = false, Message = "Request body is required.", Data = (object?)null });
            try
            {
                _service.UpdateResponse(id, req.Response);
                _service.UpdateTokens(id, req.TotalPromptTokens, req.TotalResponseTokens);
                return Ok(new { Success = true, Message = "Cập nhật response thành công.", Data = (object?)null });
            }
            catch (System.UnauthorizedAccessException)
            {
                return Unauthorized(new { Success = false, Message = "Không có quyền", Data = (object?)null });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message, Data = (object?)null });
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            try
            {
                var item = _service.GetByIdForCurrentUser(id);
                if (item == null) return NotFound(new { Success = false, Message = "Not found", Data = (object?)null });

                // Try to parse stored Llmresponse (string) into LLMRecommendationResponse
                LLMRecommendationResponse? parsed = null;
                if (!string.IsNullOrEmpty(item.Llmresponse))
                {
                    try
                    {
                        var options = new System.Text.Json.JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        };
                        parsed = System.Text.Json.JsonSerializer.Deserialize<LLMRecommendationResponse>(item.Llmresponse, options);
                    }
                    catch (System.Text.Json.JsonException)
                    {
                        // ignore parse errors and return null Data
                        parsed = null;
                    }
                }

                // Return the parsed LLMRecommendationResponse directly in Data (or null if not present)
                return Ok(new { Success = true, Message = "Lấy lịch sử thành công.", Data = parsed });
            }
            catch (System.UnauthorizedAccessException)
            {
                return Unauthorized(new { Success = false, Message = "Không có quyền", Data = (object?)null });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message, Data = (object?)null });
            }
        }

        [HttpGet("mine")]
        public IActionResult GetMine()
        {
            try
            {
                var list = _service.GetAllForCurrentUser();

                var options = new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var dtos = list.Select(i =>
                {
                    object? parsed = null;
                    if (!string.IsNullOrEmpty(i.Llmresponse))
                    {
                        try
                        {
                            parsed = System.Text.Json.JsonSerializer.Deserialize<LLMRecommendationResponse>(i.Llmresponse, options);
                        }
                        catch (System.Text.Json.JsonException)
                        {
                            parsed = null;
                        }
                    }

                    return new
                    {
                        Id = i.Id,
                        InputText = i.InputText,
                        CreatedAt = i.CreatedAt,
                        Status = i.Status,
                        InputTokens = i.InputTokens,
                        OutputTokens = i.OutputTokens,
                        //Recommendation = parsed
                    };
                }).ToList();

                return Ok(new { Success = true, Message = "Lấy danh sách lịch sử thành công.", Data = dtos });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message, Data = (object?)null });
            }
        }

        [HttpPut("{id}/status")]
        public IActionResult UpdateStatus(int id, [FromBody] UpdateLlmHistoryStatusRequest req)
        {
            if (req == null) return BadRequest(new { Success = false, Message = "Request body is required.", Data = (object?)null });
            try
            {
                // Validate allowed statuses to avoid arbitrary values
                var allowed = new[] { "Đang mở", "Đã ghim", "Đã xoá" };
                if (string.IsNullOrWhiteSpace(req.Status) || !allowed.Contains(req.Status))
                {
                    return BadRequest(new { Success = false, Message = "Trạng thái không hợp lệ.", Data = (object?)null });
                }

                _service.UpdateStatus(id, req.Status);
                return Ok(new { Success = true, Message = "Cập nhật status thành công.", Data = (object?)null });
            }
            catch (System.UnauthorizedAccessException)
            {
                return Unauthorized(new { Success = false, Message = "Không có quyền", Data = (object?)null });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message, Data = (object?)null });
            }
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                // Perform soft-delete by setting status = "Đã xoá"
                _service.UpdateStatus(id, "Đã xoá");
                return Ok(new { Success = true, Message = "Xóa mềm lịch sử thành công.", Data = (object?)null });
            }
            catch (System.UnauthorizedAccessException)
            {
                return Unauthorized(new { Success = false, Message = "Không có quyền", Data = (object?)null });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message, Data = (object?)null });
            }
        }
    }
}
