using Microsoft.AspNetCore.Mvc;
using System.Linq;
using StudyHub.Backend.UseCases.Services;
using Microsoft.AspNetCore.SignalR;
using StudyHub.Backend.Api.Hubs;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Utils;
using System.Threading.Tasks;
using System.Text;
using System.Net.Mime;
using StudyHub.Backend.Api.Dtos.PaymentDTOS;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TransactionController : ControllerBase
    {
        private readonly TransactionService _txService;
        private readonly PaymentService _paymentService;
        private readonly CloudFileStorageService _fileStorage;
        private readonly IHubContext<PaymentHub> _hubContext;

        public TransactionController(TransactionService txService, PaymentService paymentService, CloudFileStorageService fileStorage, IHubContext<PaymentHub> hubContext)
        {
            _txService = txService;
            _paymentService = paymentService;
            _fileStorage = fileStorage;
            _hubContext = hubContext;
        }

        private IActionResult PagedResult<T>(List<T> items, int total, int page, int limit)
        {
            return Ok(new
            {
                success = true,
                data = new StudyHub.Backend.UseCases.Dtos.PagedResult<T>
                {
                    Items = items,
                    Total = total,
                    Page = page,
                    Limit = limit,
                    TotalPages = (int)System.Math.Ceiling(total / (double)limit)
                }
            });
        }

        [HttpGet("user/{userId}")]
        public IActionResult GetByUser([FromRoute] Guid userId)
        {
            var list = _txService.GetByUser(userId);
            var dto = list.Select(x => new TransactionDto
            {
                Id = x.Id,
                UserId = x.UserId,
                Amount = x.Amount,
                Type = x.Type,
                CourseId = x.CourseId,
                Description = x.Description,
                Status = x.Status,
                TransactionCode = x.TransactionCode,
                CreatedAt = x.CreatedAt,
                ProcessedAt = x.ProcessedAt,
                QrcodeUrl = x.QrcodeUrl,
                AccountNumber = x.AccountNumber
            }).ToList();
            return Ok(dto);
        }

        [HttpPost("request")]
        public IActionResult RequestTransaction([FromBody] CreateTransactionRequest req)
        {
            if (req.Amount <= 0) return BadRequest("Amount must be > 0");
            // For Withdraw: reserve funds immediately by debiting the user's wallet
            if (string.Equals(req.Type, "Withdraw", System.StringComparison.OrdinalIgnoreCase))
            {
                var debit = _paymentService.DebitWalletByUserId(req.UserId, req.Amount);
                if (debit == null) return NotFound("User not found");
                if (debit == -1) return BadRequest("Insufficient funds");
                // debit succeeded (balance returned), continue to create pending transaction
            }

            var tx = new Transaction
            {
                UserId = req.UserId,
                Amount = req.Amount,
                Type = req.Type,
                CourseId = req.CourseId,
                AccountNumber = req.AccountNumber,
                QrcodeUrl = req.QrcodeUrl,
                Description = req.Description,
                Status = "Pending",
                CreatedAt = System.DateTime.UtcNow
            };
            var created = _txService.CreateTransaction(tx);
            var dto = new TransactionDto
            {
                Id = created.Id,
                UserId = created.UserId,
                Amount = created.Amount,
                Type = created.Type,
                CourseId = created.CourseId,
                Description = created.Description,
                Status = created.Status,
                TransactionCode = created.TransactionCode,
                CreatedAt = created.CreatedAt,
                ProcessedAt = created.ProcessedAt,
                AccountNumber = created.AccountNumber,
                QrcodeUrl = created.QrcodeUrl
            };
            return Ok(dto);
        }

        [HttpGet("pending")]
        public IActionResult GetPending([
            FromQuery] string? type = null,
            [FromQuery] string? status = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 5)
        {
            // Delegate filtering + paging to service/repository layer
            var paged = _txService.GetByFilter(type, status, pageNumber, pageSize);

            var dtoItems = paged.Items.Select(x => new TransactionDto
            {
                Id = x.Id,
                UserId = x.UserId,
                Amount = x.Amount,
                Type = x.Type,
                CourseId = x.CourseId,
                Description = x.Description,
                Status = x.Status,
                TransactionCode = x.TransactionCode,
                CreatedAt = x.CreatedAt,
                ProcessedAt = x.ProcessedAt,
                QrcodeUrl = x.QrcodeUrl,
                AccountNumber = x.AccountNumber
            }).ToList();

            return PagedResult(dtoItems, paged.Total, paged.Page, paged.Limit);
        }

         // export Word (.doc) using an HTML table
        [HttpGet("export/doc")]
        public IActionResult ExportDoc([
            FromQuery] string? type = null,
            [FromQuery] string? status = null,
            [FromQuery] string? userId = null)
        {
            List<Transaction> list;
            if (!string.IsNullOrWhiteSpace(userId) && System.Guid.TryParse(userId, out var uid))
            {
                list = _txService.GetByUser(uid);
            }
            else
            {
                list = _txService.GetForExport(type, status);
            }

            var sb = new StringBuilder();
            sb.AppendLine("<html><head><meta charset=\"utf-8\"/></head><body>");
            sb.AppendLine("<table border=\"1\" cellpadding=\"4\" cellspacing=\"0\">\n<thead><tr>");
            sb.AppendLine("<th>TransactionCode</th><th>UserId</th><th>Type</th><th>Status</th><th>Amount</th><th>CourseId</th><th>AccountNumber</th><th>CreatedAt</th><th>ProcessedAt</th><th>Description</th>");
            sb.AppendLine("</tr></thead>\n<tbody>");
            foreach (var t in list)
            {
                var created = t.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
                var processed = t.ProcessedAt.HasValue ? t.ProcessedAt.Value.ToString("yyyy-MM-dd HH:mm:ss") : "";
                sb.AppendLine("<tr>");
                string Cell(object? o) => $"<td>{System.Net.WebUtility.HtmlEncode(o?.ToString() ?? "")}</td>";
                sb.AppendLine(Cell(t.TransactionCode));
                sb.AppendLine(Cell(t.UserId));
                sb.AppendLine(Cell(t.Type));
                sb.AppendLine(Cell(t.Status));
                sb.AppendLine(Cell(t.Amount));
                sb.AppendLine(Cell(t.CourseId));
                sb.AppendLine(Cell(t.AccountNumber));
                sb.AppendLine(Cell(created));
                sb.AppendLine(Cell(processed));
                sb.AppendLine(Cell(t.Description));
                sb.AppendLine("</tr>");
            }
            sb.AppendLine("</tbody></table></body></html>");

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            var fileName = $"transactions_{System.DateTime.UtcNow:yyyyMMddHHmmss}.doc";
            return File(bytes, "application/msword", fileName);
        }

        // export CSV of transactions matching optional type/status filters
        [HttpGet("export/csv")]
        public IActionResult ExportCsv([
            FromQuery] string? type = null,
            [FromQuery] string? status = null,
            [FromQuery] string? userId = null)
        {
            List<Transaction> list;
            if (!string.IsNullOrWhiteSpace(userId) && System.Guid.TryParse(userId, out var uid))
            {
                list = _txService.GetByUser(uid);
            }
            else
            {
                list = _txService.GetForExport(type, status);
            }

            string Escape(object? o)
            {
                if (o == null) return "";
                var s = o.ToString() ?? "";
                // escape quotes
                if (s.Contains('"')) s = s.Replace("\"", "\"\"");
                // wrap in quotes if contains comma/newline/quote
                if (s.Contains(',') || s.Contains('\n') || s.Contains('\r') || s.Contains('"')) s = $"\"{s}\"";
                return s;
            }

            var sb = new StringBuilder();
            // UTF-8 BOM for Excel
            sb.Append('\uFEFF');
            sb.AppendLine("TransactionCode,UserId,Type,Status,Amount,CourseId,AccountNumber,CreatedAt,ProcessedAt,Description");
            foreach (var t in list)
            {
                var created = $"'{t.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")}"; // prefix apostrophe so Excel treats as text
                var processed = t.ProcessedAt.HasValue ? $"'{t.ProcessedAt.Value.ToString("yyyy-MM-dd HH:mm:ss")}" : "";
                sb.AppendLine(string.Join(",",
                    Escape(t.TransactionCode),
                    Escape(t.UserId),
                    Escape(t.Type),
                    Escape(t.Status),
                    Escape(t.Amount),
                    Escape(t.CourseId),
                    Escape(t.AccountNumber),
                    Escape(created),
                    Escape(processed),
                    Escape(t.Description)
                ));
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            var fileName = $"transactions_{System.DateTime.UtcNow:yyyyMMddHHmmss}.csv";
            return File(bytes, "text/csv; charset=utf-8", fileName);
        }

        // export revenue CSV (grouped by date or by course)
        [HttpGet("export/revenue/csv")]
        public IActionResult ExportRevenueCsv([
            FromQuery] string? from = null,
            [FromQuery] string? to = null,
            [FromQuery] string? courseId = null,
            [FromQuery] string? teacherId = null,
            [FromQuery] string? mode = null)
        {
            System.DateTime? f = null;
            System.DateTime? t = null;
            if (!string.IsNullOrWhiteSpace(from) && System.DateTime.TryParse(from, out var tmpf)) f = tmpf;
            if (!string.IsNullOrWhiteSpace(to) && System.DateTime.TryParse(to, out var tmpt)) t = tmpt;
            int? cid = null;
            if (!string.IsNullOrWhiteSpace(courseId) && int.TryParse(courseId, out var tmpCid)) cid = tmpCid;
            System.Guid? tid = null;
            if (!string.IsNullOrWhiteSpace(teacherId) && System.Guid.TryParse(teacherId, out var tmpTid)) tid = tmpTid;

            var rows = _txService.GetRevenueForExport(f, t, cid, tid, mode);

            string Escape(object? o)
            {
                if (o == null) return "";
                var s = o.ToString() ?? "";
                if (s.Contains('"')) s = s.Replace("\"", "\"\"");
                if (s.Contains(',') || s.Contains('\n') || s.Contains('\r') || s.Contains('"')) s = $"\"{s}\"";
                return s;
            }

            var sb = new StringBuilder();
            sb.Append('\uFEFF');
            sb.AppendLine("Label,CourseId,CourseName,TeacherId,TeacherName,TotalAmount,TransactionCount");
            foreach (var r in rows)
            {
                sb.AppendLine(string.Join(",",
                    Escape(r.Label),
                    Escape(r.CourseId),
                    Escape(r.CourseName),
                    Escape(r.TeacherId),
                    Escape(r.TeacherName),
                    Escape(r.TotalAmount),
                    Escape(r.TransactionCount)
                ));
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            var fileName = $"revenue_{System.DateTime.UtcNow:yyyyMMddHHmmss}.csv";
            return File(bytes, "text/csv; charset=utf-8", fileName);
        }

        // export revenue as Word (.doc) using an HTML table
        [HttpGet("export/revenue/doc")]
        public IActionResult ExportRevenueDoc([
            FromQuery] string? from = null,
            [FromQuery] string? to = null,
            [FromQuery] string? courseId = null,
            [FromQuery] string? teacherId = null,
            [FromQuery] string? mode = null)
        {
            System.DateTime? f = null;
            System.DateTime? t = null;
            if (!string.IsNullOrWhiteSpace(from) && System.DateTime.TryParse(from, out var tmpf)) f = tmpf;
            if (!string.IsNullOrWhiteSpace(to) && System.DateTime.TryParse(to, out var tmpt)) t = tmpt;
            int? cid = null;
            if (!string.IsNullOrWhiteSpace(courseId) && int.TryParse(courseId, out var tmpCid)) cid = tmpCid;
            System.Guid? tid = null;
            if (!string.IsNullOrWhiteSpace(teacherId) && System.Guid.TryParse(teacherId, out var tmpTid)) tid = tmpTid;

            var rows = _txService.GetRevenueForExport(f, t, cid, tid, mode);

            var sb = new StringBuilder();
            sb.AppendLine("<html><head><meta charset=\"utf-8\"/></head><body>");
            sb.AppendLine("<table border=\"1\" cellpadding=\"4\" cellspacing=\"0\"><thead><tr>");
            sb.AppendLine("<th>Label</th><th>CourseId</th><th>CourseName</th><th>TeacherId</th><th>TeacherName</th><th>TotalAmount</th><th>TransactionCount</th>");
            sb.AppendLine("</tr></thead><tbody>");
            foreach (var r in rows)
            {
                string Cell(object? o) => $"<td>{System.Net.WebUtility.HtmlEncode(o?.ToString() ?? "")}</td>";
                sb.AppendLine("<tr>");
                sb.AppendLine(Cell(r.Label));
                sb.AppendLine(Cell(r.CourseId));
                sb.AppendLine(Cell(r.CourseName));
                sb.AppendLine(Cell(r.TeacherId));
                sb.AppendLine(Cell(r.TeacherName));
                sb.AppendLine(Cell(r.TotalAmount));
                sb.AppendLine(Cell(r.TransactionCount));
                sb.AppendLine("</tr>");
            }
            sb.AppendLine("</tbody></table></body></html>");

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            var fileName = $"revenue_{System.DateTime.UtcNow:yyyyMMddHHmmss}.doc";
            return File(bytes, "application/msword", fileName);
        }

        // convenience: expose a /pdf route that produces the same document bytes.
        // Note: project currently doesn't include a server-side HTML->PDF renderer. This endpoint returns the same HTML-based .doc content
        // but with a .pdf filename so frontend can download a single-file API. Consider adding a PDF generator (WkHtmlToPdf, DinkToPdf, iText7, etc.)
        [HttpGet("export/revenue/pdf")]
        public IActionResult ExportRevenuePdf([
            FromQuery] string? from = null,
            [FromQuery] string? to = null,
            [FromQuery] string? courseId = null,
            [FromQuery] string? teacherId = null,
            [FromQuery] string? mode = null)
        {
            // reuse the doc generator and return bytes but name as .pdf. The bytes are HTML (Word-compatible). For real PDF output,
            // a PDF generation library should be integrated.
            System.DateTime? f = null;
            System.DateTime? t = null;
            if (!string.IsNullOrWhiteSpace(from) && System.DateTime.TryParse(from, out var tmpf)) f = tmpf;
            if (!string.IsNullOrWhiteSpace(to) && System.DateTime.TryParse(to, out var tmpt)) t = tmpt;
            int? cid = null;
            if (!string.IsNullOrWhiteSpace(courseId) && int.TryParse(courseId, out var tmpCid)) cid = tmpCid;
            System.Guid? tid = null;
            if (!string.IsNullOrWhiteSpace(teacherId) && System.Guid.TryParse(teacherId, out var tmpTid)) tid = tmpTid;

            var rows = _txService.GetRevenueForExport(f, t, cid, tid, mode);

            var sb = new StringBuilder();
            sb.AppendLine("<html><head><meta charset=\"utf-8\"/></head><body>");
            sb.AppendLine("<table border=\"1\" cellpadding=\"4\" cellspacing=\"0\"><thead><tr>");
            sb.AppendLine("<th>Label</th><th>CourseId</th><th>CourseName</th><th>TeacherId</th><th>TeacherName</th><th>TotalAmount</th><th>TransactionCount</th>");
            sb.AppendLine("</tr></thead><tbody>");
            foreach (var r in rows)
            {
                string Cell(object? o) => $"<td>{System.Net.WebUtility.HtmlEncode(o?.ToString() ?? "")}</td>";
                sb.AppendLine("<tr>");
                sb.AppendLine(Cell(r.Label));
                sb.AppendLine(Cell(r.CourseId));
                sb.AppendLine(Cell(r.CourseName));
                sb.AppendLine(Cell(r.TeacherId));
                sb.AppendLine(Cell(r.TeacherName));
                sb.AppendLine(Cell(r.TotalAmount));
                sb.AppendLine(Cell(r.TransactionCount));
                sb.AppendLine("</tr>");
            }
            sb.AppendLine("</tbody></table></body></html>");

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            var fileName = $"revenue_{System.DateTime.UtcNow:yyyyMMddHHmmss}.pdf";
            // returning HTML bytes; content-type set to application/pdf for download convenience. Replace with real PDF generator later.
            return File(bytes, "application/pdf", fileName);
        }

        [HttpPost("upload-proof")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadProof([FromForm] UploadTransactionProofDto dto)
        {
            var file = dto.File;
            if (file == null || file.Length == 0) return BadRequest("File is required");

            try
            {
                var path = FileConstants.TransactionProofUploadPath;
                var url = await _fileStorage.UploadFileAsync(file, path);
                if (string.IsNullOrEmpty(url))
                    return StatusCode(500, "Upload failed");

                return Ok(new { url });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("{id}/approve")]
        public async Task<IActionResult> Approve([FromRoute] int id, [FromBody] TransactionDto body)
        {
            // Approve a pending transaction. For Withdraw (we already debited at request), simply mark Success and attach QrcodeUrl if provided.
            var tx = _txService.GetByUser(body.UserId).FirstOrDefault(x => x.Id == id);
            if (tx == null) return NotFound();
            if (!string.Equals(tx.Status, "Pending", System.StringComparison.OrdinalIgnoreCase))
                return BadRequest("Transaction is not pending");

            // If it's a Refund: credit user's wallet now
            if (string.Equals(tx.Type, "Refund", System.StringComparison.OrdinalIgnoreCase))
            {
                var credited = _paymentService.CreditWalletByUserId(tx.UserId, tx.Amount);
                if (credited == null) return NotFound("User not found when crediting refund");
            }

            // attach proof if provided
            if (!string.IsNullOrEmpty(body.QrcodeUrl) || !string.IsNullOrEmpty(body.AccountNumber))
            {
                tx.QrcodeUrl = body.QrcodeUrl ?? tx.QrcodeUrl;
                tx.AccountNumber = body.AccountNumber ?? tx.AccountNumber;
            }

            tx.Status = "Success";
            tx.ProcessedAt = System.DateTime.UtcNow;
            _txService.UpdateTransaction(tx);

            // notify user via SignalR
            try
            {
                await _hubContext.Clients.Group($"user_{tx.UserId}").SendAsync("TransactionStatusChanged", new
                {
                    transactionId = tx.Id,
                    status = tx.Status,
                    type = tx.Type,
                    amount = tx.Amount,
                    processedAt = tx.ProcessedAt
                });
            }
            catch { }

            return Ok(new { message = "approved" });
        }

        [HttpPost("{id}/reject")]
        public async Task<IActionResult> Reject([FromRoute] int id, [FromBody] TransactionDto body)
        {
            var tx = _txService.GetByUser(body.UserId).FirstOrDefault(x => x.Id == id);
            if (tx == null) return NotFound();
            if (!string.Equals(tx.Status, "Pending", System.StringComparison.OrdinalIgnoreCase))
                return BadRequest("Transaction is not pending");

            // If Withdraw was reserved (we debited at request), refund the amount back to user's wallet
            if (string.Equals(tx.Type, "Withdraw", System.StringComparison.OrdinalIgnoreCase))
            {
                var refunded = _paymentService.CreditWalletByUserId(tx.UserId, tx.Amount);
                if (refunded == null) return NotFound("User not found when refunding");
            }

            tx.Status = "Cancelled";
            tx.ProcessedAt = System.DateTime.UtcNow;
            _txService.UpdateTransaction(tx);

            try
            {
                await _hubContext.Clients.Group($"user_{tx.UserId}").SendAsync("TransactionStatusChanged", new
                {
                    transactionId = tx.Id,
                    status = tx.Status,
                    type = tx.Type,
                    amount = tx.Amount,
                    processedAt = tx.ProcessedAt
                });
            }
            catch { }

            return Ok(new { message = "rejected" });
        }

    }
}
