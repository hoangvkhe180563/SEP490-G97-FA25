using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Api.Dtos.CourseDTOS;

namespace StudyHub.Backend.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class EnrollmentController : ControllerBase
{
    private readonly EnrollmentService _enrollService;
    private readonly ProgressService _progressService;
    private readonly PaymentService _paymentService;
    private readonly CourseService _courseService;

    public EnrollmentController(EnrollmentService enrollService, ProgressService progressService, PaymentService paymentService, CourseService courseService)
    {
        _enrollService = enrollService;
        _progressService = progressService;
        _paymentService = paymentService;
        _courseService = courseService;
    }

    [HttpPost]
    public IActionResult Enroll([FromBody] EnrollmentDto dto)
    {
        if (dto == null) return BadRequest();

        var course = _courseService.GetCourse(dto.CourseId);
        if (course == null) return BadRequest("Course not found");

        if (course.Price > 0)
        {
            var debitResult = _paymentService.DebitWalletByUserId(dto.AppUserId, (long)course.Price);
            if (debitResult == null)
            {
                return BadRequest("User not found");
            }
            if (debitResult == -1)
            {
                return BadRequest("Insufficient wallet balance");
            }

            // proceed to create enrollment; if creation fails, refund
            try
            {
                var entity = dto.ToEntity();
                var created = _enrollService.CreateEnrollment(entity);
                return CreatedAtAction(nameof(GetEnrollment), new { id = created.Id }, created.ToListDto());
            }
            catch (Exception)
            {
                // refund
                try { _paymentService.CreditWalletByUserId(dto.AppUserId, (long)course.Price); } 
                catch { /* ignore */ }
                return StatusCode(500, "Failed to create enrollment after charging. Refunded.");
            }
        }

        // free course or price == 0
        var entityNoCharge = dto.ToEntity();
        var createdNoCharge = _enrollService.CreateEnrollment(entityNoCharge);
        return CreatedAtAction(nameof(GetEnrollment), new { id = createdNoCharge.Id }, createdNoCharge.ToListDto());
    }

    [HttpGet("user/{userId}")]
    public IActionResult GetByUser(Guid userId)
    {
        var items = _enrollService.GetEnrollmentsByUser(userId);
        return Ok(items.Select(i => i.ToListDto()));
    }

    [HttpGet("{id}")]
    public IActionResult GetEnrollment(int id)
    {
        var e = _enrollService.GetEnrollment(id);
        if (e == null) return NotFound();
        return Ok(e.ToListDto());
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteEnrollment(int id)
    {
        var ok = _enrollService.DeleteEnrollment(id);
        if (!ok) return NotFound();
        return NoContent();
    }

    // Progress endpoints
    [HttpGet("{enrollmentId}/progress")]
    public IActionResult GetProgresses(int enrollmentId)
    {
        var list = _progressService.GetProgressesByEnrollment(enrollmentId);
        return Ok(list.Select(p => p.ToListDto()));
    }

    [HttpPost("{enrollmentId}/progress")]
    public IActionResult RecordProgress(int enrollmentId, [FromBody] ProgressDto dto)
    {
        if (dto == null) return BadRequest();
        var existing = _progressService.GetProgressByEnrollmentAndLesson(enrollmentId, dto.LessonId);
        if (existing != null)
        {
            existing.CompletionDate = dto.CompletionDate == default ? DateTime.UtcNow : dto.CompletionDate;
            var updated = _progressService.UpdateProgress(existing);
            return Ok(updated.ToDto());
        }
        dto.EnrollmentId = enrollmentId;
        var created = _progressService.CreateProgress(dto.ToEntity());
        return CreatedAtAction(nameof(GetProgresses), new { enrollmentId }, created.ToListDto());
    }
}
