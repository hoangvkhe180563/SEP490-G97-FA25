using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Api.Dtos;

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
    public IActionResult GetAll()
    {
        var courses = _service.GetCourses();
        return Ok(courses.Select(c => c.ToListDto()));
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
        // map dto to domain minimal for create
        var domain = new Domain.Entities.Course
        {
            Name = dto.Name,
            Information = dto.Information,
            ImageUrl = dto.ImageUrl,
            Price = dto.Price,
            SubjectId = dto.SubjectId,
            Grade = dto.Grade,
            CreatedAt = System.DateTime.UtcNow
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
