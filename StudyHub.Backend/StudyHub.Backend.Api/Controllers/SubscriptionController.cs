using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos.SubcriptionDTOS;
using StudyHub.Backend.Api.Mappers;

namespace StudyHub.Backend.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SubscriptionController : ControllerBase
{
    private readonly SubscriptionService _service;

    private readonly AuthService _authService;
    private readonly PaymentService _paymentService;

    public SubscriptionController(SubscriptionService service, AuthService authService, PaymentService paymentService)
    {
        _service = service;
        _authService = authService;
        _paymentService = paymentService;
    }

    [HttpPost("subscribe")]
    public IActionResult Subscribe([FromBody] SubscribeDto dto)
    {
        try
        {
            var userId = _authService.GetCurrentUser().Id;

            if (userId == Guid.Empty) return Unauthorized();

            // charge wallet if price > 0 (similar to EnrollmentController)
            var price = (long)dto.Price;
            if (price > 0)
            {
                var debitResult = _paymentService.DebitWalletByUserId(userId, price);
                if (debitResult == null) return BadRequest("User not found");
                if (debitResult == -1) return BadRequest("Insufficient wallet balance");
            }

            var now = DateTime.UtcNow;
            var sub = new Subscription
            {
                AppUserId = userId,
                PackageName = dto.PackageName ?? "QA-Monthly",
                Price = dto.Price,
                StartAt = now,
                EndAt = now.AddMonths(dto.Months <= 0 ? 1 : dto.Months),
                IsActive = true,
                CreatedAt = now
            };

            try
            {
                var created = _service.CreateSubscription(sub);
                return Ok(new { success = true, data = created?.ToDto() });
            }
            catch (Exception)
            {
                try { if (price > 0) _paymentService.CreditWalletByUserId(userId, price); } catch { }
                throw;
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("active/{userId}")]
    public IActionResult GetActive(string userId)
    {
        try
        {
            if (!Guid.TryParse(userId, out var uid)) return BadRequest("invalid user id");
            var s = _service.GetActiveSubscription(uid);
            if (s == null) return NotFound();
            return Ok(s.ToDto());
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("active")]
    public IActionResult GetMyActive()
    {
        try
        {
            var userId = _authService.GetCurrentUser().Id;
            if (userId == Guid.Empty) return Unauthorized();
            var s = _service.GetActiveSubscription(userId);
            if (s == null) return NotFound();
            return Ok(s.ToDto());
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}
