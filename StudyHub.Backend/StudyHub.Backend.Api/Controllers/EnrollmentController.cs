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

    /// <summary>
    /// Consume available wallet for a course registration. If the wallet fully covers the course price
    /// this endpoint will debit the wallet and create the enrollment (same as Enroll). If the wallet
    /// is insufficient it will debit whatever is available and return the remaining amount to be paid.
    /// </summary>
    [HttpPost("consume-wallet")]
    public IActionResult ConsumeWallet([FromBody] ConsumeWalletDto dto)
    {
        if (dto == null) return BadRequest();

        var course = _courseService.GetCourse(dto.CourseId);
        if (course == null) return BadRequest("Course not found");

        var price = (long)course.Price;

        // free course: create enrollment immediately
        if (price <= 0)
        {
            var entityFree = new EnrollmentDto { AppUserId = dto.AppUserId, CourseId = dto.CourseId }.ToEntity();
            var createdFree = _enrollService.CreateEnrollment(entityFree);
            return CreatedAtAction(nameof(GetEnrollment), new { id = createdFree.Id }, createdFree.ToListDto());
        }

        var wallet = _paymentService.GetWalletByUserId(dto.AppUserId);
        if (wallet == null) return BadRequest("User not found");

        // wallet fully covers price -> debit and create enrollment
        if (wallet >= price)
        {
            var debitResult = _paymentService.DebitWalletByUserId(dto.AppUserId, price);
            if (debitResult == null) return BadRequest("User not found");
            if (debitResult == -1) return BadRequest("Insufficient wallet balance"); // unlikely since we checked

            try
            {
                var entity = new EnrollmentDto { AppUserId = dto.AppUserId, CourseId = dto.CourseId }.ToEntity();
                var created = _enrollService.CreateEnrollment(entity);
                return CreatedAtAction(nameof(GetEnrollment), new { id = created.Id }, created.ToListDto());
            }
            catch (Exception)
            {
                // refund
                try { _paymentService.CreditWalletByUserId(dto.AppUserId, price); } catch { }
                return StatusCode(500, "Failed to create enrollment after charging. Refunded.");
            }
        }

        // wallet is positive but less than price -> consume wallet and return remaining
        var toDeduct = wallet.Value > 0 ? wallet.Value : 0L;
        long deducted = 0;
        if (toDeduct > 0)
        {
            var debitPartial = _paymentService.DebitWalletByUserId(dto.AppUserId, toDeduct);
            if (debitPartial == null) return BadRequest("User not found");
            if (debitPartial == -1)
            {
                // should not happen because toDeduct <= wallet
                return StatusCode(500, "Failed to deduct wallet.");
            }
            deducted = toDeduct;
        }

        var remaining = price - deducted;
        var balanceAfter = _paymentService.GetWalletByUserId(dto.AppUserId) ?? 0L;

        return Ok(new { deducted, remaining, balance = balanceAfter, courseId = dto.CourseId, price });
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
