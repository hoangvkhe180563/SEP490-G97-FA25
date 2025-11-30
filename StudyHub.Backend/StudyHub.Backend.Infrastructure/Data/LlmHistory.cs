using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class LlmHistory
{
    public int Id { get; set; }

    public Guid UserId { get; set; }

    public string? InputText { get; set; }

    public string? Llmresponse { get; set; }

    public string Status { get; set; } = null!;

    public int? InputTokens { get; set; }

    public int? OutputTokens { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual AppUser User { get; set; } = null!;
}
