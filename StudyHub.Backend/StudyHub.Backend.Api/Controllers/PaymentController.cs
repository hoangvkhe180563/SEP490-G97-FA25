using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.UseCases.Services;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly PaymentService _paymentService;
        private readonly TransactionService _transactionService;
        private static readonly ConcurrentDictionary<string, bool> _paidTx = new();

        public PaymentController(PaymentService paymentService, TransactionService transactionService)
        {
            _paymentService = paymentService;
            _transactionService = transactionService;
        }

        [HttpPost("notify")]
        public IActionResult Notify([FromBody] PaymentNotifyDto dto)
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
                var existing = _transactionService.GetByTransactionCode(dto.referenceCode ?? string.Empty);
                if (existing != null && existing.Status == "Success")
                    return Ok(new { message = "already processed" });

                var match = Regex.Match(txRef, @"CH\s*(\d{6})", RegexOptions.IgnoreCase);
                if (!match.Success)
                    return BadRequest("Invalid payload: transferId not found after 'CH'");

                int transferId = int.Parse(match.Groups[1].Value);

                // create DB transaction record (Pending) for idempotency and audit
                var userId = _transactionService.GetUserIdByTransferId(transferId);
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
                    tx = _transactionService.CreateTransaction(tx);
                }
                catch (Exception)
                {
                    // possibly unique constraint violation on TransactionCode - check existing
                    var exCheck = _transactionService.GetByTransactionCode(dto.referenceCode ?? string.Empty);
                    if (exCheck != null && exCheck.Status == "Success")
                        return Ok(new { message = "already processed" });
                    // otherwise allow to continue (we may have transient DB error)
                }

                var newBalance = _paymentService.CreditWallet(transferId, amount);
                if (newBalance == null)
                {
                    // update tx to failed
                    if (tx?.Id > 0) _transactionService.UpdateStatus(tx.Id, "Failed");
                    return NotFound($"User with transferId {transferId} not found");
                }

                if (tx?.Id > 0) _transactionService.UpdateStatus(tx.Id, "Success");

                // keep in-memory quick lookup for existing endpoints
                if (!string.IsNullOrEmpty(txRef))
                    _paidTx[txRef] = true;

                try { _paidTx[$"CH{transferId}"] = true; } catch { }

                return Ok(new
                {
                    transferId,
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

        [HttpGet("status")]
        public IActionResult Status([FromQuery] string txRef)
        {
            if (string.IsNullOrEmpty(txRef)) return BadRequest("txRef is required");
            var paid = _paidTx.TryGetValue(txRef, out var ok) && ok;
            return Ok(new { txRef, status = paid ? "Paid" : "Pending" });
        }
    }
}
