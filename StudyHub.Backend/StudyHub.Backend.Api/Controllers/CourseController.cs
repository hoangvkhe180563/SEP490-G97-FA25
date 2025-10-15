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

    [HttpGet]
    public IActionResult GetAll([FromBody] CourseQueryParams courseQueryParams)
    {
        var query = new CourseQueryParams
        {
            Q = courseQueryParams.Q,
            SubjectId = courseQueryParams.SubjectId,
            Grade = courseQueryParams.Grade,
            Status = courseQueryParams.Status,
            IsFeatured = courseQueryParams.Status,
            SortBy = courseQueryParams.SortBy,
            Page = courseQueryParams.Page,
            PageSize = courseQueryParams.PageSize
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

    [HttpGet("{id}")]
    public IActionResult Get(int id)
    {
        var course = _service.GetCourse(id);
        if (course == null) return NotFound();
        return Ok(course.ToDetailDto());
    }

    [HttpPost]
    public IActionResult Create([FromBody] CourseDetailDto dto)
    {
        var domain = new Domain.Entities.Course
        {
            Name = dto.Name,
            Information = dto.Information,
            ImageUrl = dto.ImageUrl,
            Price = dto.Price,
            SubjectId = dto.SubjectId,
            Grade = dto.Grade,
            CreatedAt = DateTime.UtcNow
        };
        var created = _service.CreateCourse(domain);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created.ToDetailDto());
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] CourseDetailDto dto)
    {
        var existing = _service.GetCourse(id);
        if (existing == null) return NotFound();
        existing.Name = dto.Name;
        existing.Information = dto.Information;
        existing.ImageUrl = dto.ImageUrl;
        existing.Price = dto.Price;
        existing.SubjectId = dto.SubjectId;
        existing.Grade = dto.Grade;
        var updated = _service.UpdateCourse(existing);
        return Ok(updated.ToDetailDto());
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var ok = _service.DeleteCourse(id);
        if (!ok) return NotFound();
        return NoContent();
    }
}
