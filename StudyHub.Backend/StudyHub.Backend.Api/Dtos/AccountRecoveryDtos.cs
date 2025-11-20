using System;

namespace StudyHub.Backend.Api.Dtos
{
    public class CreateAccountRecoveryRequest
    {
        public string Identifier { get; set; } = null!; // email or username
        public string Reason { get; set; } = null!;
    }

    public class AccountRecoveryListItemDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? RequestReason { get; set; }
        public string Status { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public Guid? ProcessedBy { get; set; }
    }

    public class SetRecoveryStatusRequest
    {
        public string? Status { get; set; }
    }
}
