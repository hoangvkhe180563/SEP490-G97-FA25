using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using Microsoft.AspNetCore.SignalR;
using StudyHub.Backend.Api.Hubs;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using StudyHub.Backend.Api.Dtos.PaymentDTOS;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly PaymentService _paymentService;
        private readonly TransactionService _transaction_service;
        private readonly IHubContext<PaymentHub> _hubContext;
        private readonly ILogger<PaymentController> _logger;
        private static readonly ConcurrentDictionary<string, bool> _paidTx = new();

        public PaymentController(PaymentService paymentService, TransactionService transactionService, IHubContext<PaymentHub> hubContext, ILogger<PaymentController> logger)
        {
            _paymentService = paymentService;
            _transaction_service = transactionService;
            _hubContext = hubContext;
            _logger = logger;
        }

        [HttpPost("notify")]
        public async Task<IActionResult> Notify([FromBody] PaymentNotifyDto dto)
        {
            if (dto == null) return BadRequest("Invalid payload");
            try
            {
                var amount = dto.transferAmount ?? 0;
                if (amount <= 0) return BadRequest("Invalid payload: amount missing or zero");

                var txRef = dto.content ?? string.Empty;
                if (string.IsNullOrWhiteSpace(txRef))
                    return BadRequest("Invalid payload: transaction reference missing");

                // if we already have a successful transaction with this code, skip
                var existing = _transaction_service.GetByTransactionCode(dto.referenceCode ?? string.Empty);
                if (existing != null && existing.Status == "Success")
                    return Ok(new { message = "already processed" });

                // ✅ Match dạng: CH + 6 số transferId + 1-3 số courseId
                var match = Regex.Match(txRef, @"CH\s*(\d{6})(\d{1,3})?", RegexOptions.IgnoreCase);
                if (!match.Success)
                    return BadRequest("Invalid payload: transferId or courseId not found after 'CH'");

                int transferId = int.Parse(match.Groups[1].Value);
                int? courseId = null;
                if (match.Groups[2].Success)
                    courseId = int.Parse(match.Groups[2].Value);

                // create DB transaction record (Pending) for idempotency and audit
                var userId = _transaction_service.GetUserIdByTransferId(transferId);
                var tx = new StudyHub.Backend.Domain.Entities.Transaction
                {
                    TransactionCode = dto.referenceCode ?? string.Empty,
                    Amount = amount,
                    Type = "Deposit",
                    Status = "Pending",
                    CreatedAt = System.DateTime.UtcNow,
                    UserId = userId ?? Guid.Empty,
                    Description = dto.gateway ?? dto.content
                };

                try
                {
                    tx = _transaction_service.CreateTransaction(tx);
                }
                catch (Exception)
                {
                    // possibly unique constraint violation on TransactionCode - check existing
                    var exCheck = _transaction_service.GetByTransactionCode(dto.referenceCode ?? string.Empty);
                    if (exCheck != null && exCheck.Status == "Success")
                        return Ok(new { message = "already processed" });
                    // otherwise allow to continue (we may have transient DB error)
                }

                var newBalance = _paymentService.CreditWallet(transferId, amount);
                if (newBalance == null)
                {
                    // update tx to failed
                    if (tx?.Id > 0) _transaction_service.UpdateStatus(tx.Id, "Failed");
                    return NotFound($"User with transferId {transferId} not found");
                }

                if (tx?.Id > 0) _transaction_service.UpdateStatus(tx.Id, "Success");

                // keep in-memory quick lookup for existing endpoints
                if (!string.IsNullOrEmpty(txRef))
                    _paidTx[txRef] = true;

                try { _paidTx[$"CH{transferId}"] = true; } catch { }

                // push SignalR notification to the user (if known)
                try
                {
                    if (userId.HasValue && userId.Value != Guid.Empty)
                    {
                        var groupName = $"user_{userId.Value}";
                        await _hubContext.Clients.Group(groupName).SendAsync("PaymentReceived", new
                        {
                            transferId,
                            courseId,
                            balance = newBalance,
                            reference = dto.referenceCode,
                            gateway = dto.gateway,
                            transactionDate = dto.transactionDate
                        });
                        _logger.LogInformation("SignalR PaymentReceived sent to {group} for transferId {transferId}, courseId {courseId}", groupName, transferId, courseId);
                    }
                    else
                    {
                        _logger.LogInformation("No userId resolved for transferId {transferId} — skipping SignalR send", transferId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "SignalR send failed for transferId {transferId}", transferId);
                    // don't fail the webhook if notification fails
                }

                return Ok(new
                {
                    transferId,
                    courseId,
                    balance = newBalance,
                    message = "credited",
                    reference = dto.referenceCode,
                    gateway = dto.gateway,
                    transactionDate = dto.transactionDate
                });
            }
            catch (OverflowException)
            {
                return BadRequest("Amount overflow");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}
