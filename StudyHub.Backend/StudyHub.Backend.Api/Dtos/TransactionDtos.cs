using System;

namespace StudyHub.Backend.Api.Dtos
{
    public class TransactionDto
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public long Amount { get; set; }
        public string Type { get; set; } = string.Empty;
        public int? CourseId { get; set; }
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? TransactionCode { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public string? QrcodeUrl { get; set; }
        public string? AccountNumber { get; set; }
    }

    public class CreateTransactionRequest
    {
        public Guid UserId { get; set; }
        public long Amount { get; set; }
        public string Type { get; set; } = string.Empty; // Refund, Withdraw
        public int? CourseId { get; set; }
        public string? AccountNumber { get; set; }
        public string? QrcodeUrl { get; set; }
        public string? Description { get; set; }
    }
    public class UploadTransactionProofDto
    {
        public IFormFile File { get; set; }
    }
}
