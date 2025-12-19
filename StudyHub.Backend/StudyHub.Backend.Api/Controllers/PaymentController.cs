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

        // NEW: notification support
        private readonly NotificationService _notificationService;
        private readonly IHubContext<NotificationHub> _notificationHub;

        public PaymentController(
            PaymentService paymentService,
            TransactionService transactionService,
            IHubContext<PaymentHub> hubContext,
            ILogger<PaymentController> logger,
            NotificationService notificationService,
            IHubContext<NotificationHub> notificationHub)
        {
            _paymentService = paymentService;
            _transaction_service = transactionService;
            _hubContext = hubContext;
            _logger = logger;
            _notificationService = notificationService;
            _notificationHub = notificationHub;
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

                // push SignalR notification to the user (PaymentHub)
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

                // NEW: create/send a Notification to the user via separate method (extracted)
                if (userId.HasValue && userId.Value != Guid.Empty)
                {
                    // fire-and-forget but awaited to ensure attempt; errors are handled inside method
                    await SendTopUpNotificationAsync(userId.Value, amount, transferId, dto.referenceCode, dto.gateway, dto.transactionDate);
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

        // Extracted: create and send top-up notification to user
        private async Task SendTopUpNotificationAsync(Guid userId, decimal amount, int transferId, string? reference, string? gateway, string? transactionDate)
        {
            try
            {
                var displayTitle = "Nạp tiền thành công";
                var displayBody = $"Số tiền {amount:N0} đã được cộng vào ví của bạn (mã giao dịch CH{transferId}).";

                // Create and persist notification for the user (targetType = User)
                var savedNotif = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                    title: displayTitle,
                    body: displayBody,
                    targetType: "User",
                    targetGroupId: null,
                    targetUserId: userId,
                    recipientUserIds: new[] { userId },
                    createdBy: userId,
                    linkUrl: "/payment/transactions",
                    priority: "Normal",
                    ct: HttpContext.RequestAborted);

                // Broadcast via NotificationHub (best-effort)
                if (savedNotif != null)
                {
                    try
                    {
                        var payload = new
                        {
                            id = savedNotif.Id,
                            title = savedNotif.Title,
                            body = savedNotif.Body,
                            linkUrl =  "/payment/transactions",
                            priority = savedNotif.Priority,
                            targetType = savedNotif.TargetType,
                            targetUserId = savedNotif.TargetUserId,
                            createdAt = savedNotif.CreatedAt,
                            createdBy = savedNotif.CreatedBy,
                            isRead = false
                        };
                        await _notificationHub.Clients.Group($"user_{userId}").SendAsync("NotificationCreated", payload, HttpContext.RequestAborted);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "NotificationHub broadcast failed for user {userId}", userId);
                        // non-fatal
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create/send top-up notification for user {userId}, transferId {transferId}", userId, transferId);
                // swallow to avoid affecting the main flow
            }
        }
    }
}