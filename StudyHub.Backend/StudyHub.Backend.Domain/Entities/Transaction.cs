using System;

namespace StudyHub.Backend.Domain.Entities
{
    public class Transaction
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public long Amount { get; set; }
        public string Type { get; set; } = string.Empty; // Deposit, Withdraw, Refund, Payment
        public int? CourseId { get; set; }
        public Guid? ConversationId { get; set; }
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty; // Pending, Success, Failed, Cancelled
        public string? TransactionCode { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public string? QrcodeUrl { get; set; }
        public string? AccountNumber { get; set; }
    }
}
