using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Dtos.LessonResourceDtos;
using StudyHub.Backend.Api.Mappers;
using System.Threading.Tasks;
using System.Linq;

namespace StudyHub.Backend.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LessonResourceController : ControllerBase
    {
        private readonly LessonResourceService _service;

        public LessonResourceController(LessonResourceService service)
        {
            _service = service;
        }


        [HttpGet("{id:int}")]
        public IActionResult GetById(int id)
        {
            var item = _service.GetById(id);
            if (item == null) return NotFound(new { success = false, message = "Not found" });
            return Ok(new { success = true, data = item.ToListDto() });
        }

        [HttpPost("create")]
        public IActionResult Create([FromBody] LessonResourceCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(new { success = false, errors = ModelState });
            var entity = dto.ToEntity();
            var created = _service.Create(entity);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, new { success = true, data = created.ToListDto() });
        }

        [HttpPut("update/{id:int}")]
        public IActionResult Update(int id, [FromBody] LessonResourceUpdateDto dto)
        {
            if (id != dto.Id) return BadRequest(new { success = false, message = "ID mismatch" });
            var existing = _service.GetById(id);
            if (existing == null) return NotFound(new { success = false, message = "Not found" });
            var updated = _service.Update(dto.ToEntity());
            return Ok(new { success = true, data = updated.ToListDto() });
        }

        [HttpDelete("{id:int}")]
        public IActionResult Delete(int id)
        {
            var existing = _service.GetById(id);
            if (existing == null) return NotFound(new { success = false, message = "Not found" });
            var ok = _service.Delete(id);
            if (!ok) return BadRequest(new { success = false, message = "Delete failed" });
            return Ok(new { success = true, message = "Deleted" });
        }
    }
}
