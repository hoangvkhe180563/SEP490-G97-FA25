using Microsoft.AspNetCore.Mvc;
using System.Linq;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Dtos.QADTOS;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Mappers;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class QATopicController : ControllerBase
    {
        private readonly QATopicService _service;

        public QATopicController(QATopicService service)
        {
            _service = service;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            try
            {
                var list = _service.GetAllTopics();
                var dtos = list.Select(t => QATopicMapper.MapToDto(t)).ToList();
                return Ok(new { Success = true, Message = "Lấy danh sách topic thành công.", Data = dtos });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy chủ đề QA.", Data = (object?)null });
            }
        }

        [HttpGet("subject/{subjectId}")]
        public IActionResult GetBySubject(int subjectId)
        {
            try
            {
                var list = _service.GetTopicsBySubject(subjectId);
                var dtos = list.Select(t => QATopicMapper.MapToDto(t)).ToList();
                return Ok(new { Success = true, Message = "Lấy danh sách topic theo môn thành công.", Data = dtos });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy chủ đề theo môn.", Data = (object?)null });
            }
        }

        [HttpPost]
        public IActionResult Create([FromBody] CreateQATopicRequest req)
        {
            if (req == null) return BadRequest(new { Success = false, Message = "Request body is required.", Data = (object?)null });
            try
            {
                var created = _service.CreateQATopic(req.Name, req.SubjectId, req.Description, req.IsActive);
                if (created == null) return StatusCode(500, new { Success = false, Message = "Không tạo được topic", Data = (object?)null });
                return CreatedAtAction(nameof(GetTopic), new { id = created.Id }, new { Success = true, Message = "Tạo topic thành công.", Data = QATopicMapper.MapToDto(created) });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi tạo topic.", Data = (object?)null });
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetTopic(int id)
        {
            try
            {
                var t = _service.GetQATopicById(id);
                if (t == null) return NotFound(new { Success = false, Message = "Topic not found.", Data = (object?)null });
                return Ok(new { Success = true, Message = "Lấy topic thành công.", Data = QATopicMapper.MapToDto(t) });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server khi lấy topic.", Data = (object?)null });
            }
        }


    }
}
