using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Api.Dtos.CourseDTOS;
using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CourseController : ControllerBase
{
    private readonly CourseService _service;
    public CourseController(CourseService service)
    {
        _service = service;
    }

    // ===================== GET ALL =====================
    [HttpGet]
    public IActionResult GetAll(
        [FromQuery] string? q,
        [FromQuery] short? subjectId,
        [FromQuery] string? subjects,
        [FromQuery] sbyte? grade,
        [FromQuery] bool? status,
        [FromQuery] bool? isFeatured,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = new CourseQueryParams
        {
            Q = q,
            SubjectId = subjectId,
            Subjects = subjects,
            Sort = sort,
            Grade = grade,
            Status = status,
            IsFeatured = isFeatured,
            Page = page,
            PageSize = pageSize
        };

        var result = _service.SearchCourses(query);

        var dto = new PagedResult<CourseListDto>
        {
            Items = result.Items.Select(i => i.ToListDto()).ToList(),
            Total = result.Total,
            Page = result.Page,
            Limit = result.Limit,
            TotalPages = result.TotalPages
        };

        return Ok(dto);
    }

    // ===================== GET BY ID =====================
    [HttpGet("{id}")]
    public IActionResult Get(int id)
    {
        var course = _service.GetCourse(id);
        if (course == null) return NotFound();
        return Ok(course.ToListDto());
    }

    // ===================== CREATE =====================
    [HttpPost]
    public IActionResult Create([FromBody] CourseDetailDto dto)
    {
        if (dto == null)
            return BadRequest("Course data is required.");

        var entity = dto.ToEntity();
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        var created = _service.CreateCourse(entity);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created.ToListDto());
    }

    // ===================== UPDATE =====================
    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] CourseDetailDto dto)
    {
        if (dto == null)
            return BadRequest("Course data is required.");

        var existing = _service.GetCourse(id);
        if (existing == null)
            return NotFound();

        // --- Update all fields from the new DTO ---
        existing.Name = dto.Name;
        existing.Information = dto.Information;
        existing.ImageUrl = dto.ImageUrl;
        existing.Price = dto.Price;
        existing.Grade = dto.Grade;
        existing.SubjectId = dto.Category;
        existing.SchoolId = dto.SchoolId;
        existing.IsFeatured = dto.IsFeatured;
        existing.Status = dto.Status;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = dto.UpdatedBy;

        // Chapters
        if (dto.Chapters != null && dto.Chapters.Any())
        {
            existing.Chapters = dto.Chapters.Select(ch => ch.ToEntity()).ToList();
        }

        var updated = _service.UpdateCourse(existing);
        return Ok(updated.ToDetailDto());
    }

    // ===================== DELETE =====================
    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var ok = _service.DeleteCourse(id);
        if (!ok)
            return NotFound();

        return NoContent();
    }
}
