using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Mappers;

namespace StudyHub.Backend.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class LectureController : ControllerBase
{
    private readonly LectureService _service;
    public LectureController(LectureService service)
    {
        _service = service;
    }

    [HttpGet("course/{courseId}/chapters")]
    public IActionResult GetChapters(int courseId)
    {
        var chapters = _service.GetChaptersForCourse(courseId);
        return Ok(chapters.Select(c => c.ToDto()));
    }

    [HttpGet("chapter/{id}")]
    public IActionResult GetChapter(int id)
    {
        var ch = _service.GetChapter(id);
        if (ch == null) return NotFound();
        return Ok(ch.ToDto());
    }

    [HttpPost("chapter")]
    public IActionResult CreateChapter([FromBody] StudyHub.Backend.Domain.Entities.Chapter ch)
    {
        var created = _service.CreateChapter(ch);
        return CreatedAtAction(nameof(GetChapter), new { id = created.Id }, created.ToDto());
    }

    [HttpPut("chapter/{id}")]
    public IActionResult UpdateChapter(int id, [FromBody] StudyHub.Backend.Domain.Entities.Chapter ch)
    {
        var existing = _service.GetChapter(id);
        if (existing == null) return NotFound();
        existing.Name = ch.Name;
        existing.Status = ch.Status;
        var updated = _service.UpdateChapter(existing);
        return Ok(updated.ToDto());
    }

    [HttpDelete("chapter/{id}")]
    public IActionResult DeleteChapter(int id)
    {
        var ok = _service.DeleteChapter(id);
        if (!ok) return NotFound();
        return NoContent();
    }

    [HttpGet("chapter/{chapterId}/lessons")]
    public IActionResult GetLessons(int chapterId)
    {
        var lessons = _service.GetLessonsForChapter(chapterId);
        return Ok(lessons.Select(l => l.ToDto()));
    }

    [HttpGet("lesson/{id}")]
    public IActionResult GetLesson(int id)
    {
        var l = _service.GetLesson(id);
        if (l == null) return NotFound();
        return Ok(l.ToDto());
    }

    [HttpPost("lesson")]
    public IActionResult CreateLesson([FromBody] StudyHub.Backend.Domain.Entities.Lesson l)
    {
        var created = _service.CreateLesson(l);
        return CreatedAtAction(nameof(GetLesson), new { id = created.Id }, created.ToDto());
    }

    [HttpPut("lesson/{id}")]
    public IActionResult UpdateLesson(int id, [FromBody] StudyHub.Backend.Domain.Entities.Lesson l)
    {
        var existing = _service.GetLesson(id);
        if (existing == null) return NotFound();
        existing.Name = l.Name;
        existing.IsPreview = l.IsPreview;
        existing.Type = l.Type;
        existing.Content = l.Content;
        var updated = _service.UpdateLesson(existing);
        return Ok(updated.ToDto());
    }

    [HttpDelete("lesson/{id}")]
    public IActionResult DeleteLesson(int id)
    {
        var ok = _service.DeleteLesson(id);
        if (!ok) return NotFound();
        return NoContent();
    }
}
