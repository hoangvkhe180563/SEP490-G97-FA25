using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class AccountRecoveryRequest
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string? RequestReason { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? ProcessedAt { get; set; }

    public Guid? ProcessedBy { get; set; }

    public virtual AppUser User { get; set; } = null!;
}
