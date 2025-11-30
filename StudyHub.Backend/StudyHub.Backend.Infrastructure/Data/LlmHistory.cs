using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class LlmHistory
{
    public int Id { get; set; }

    public Guid UserId { get; set; }

    public string? InputText { get; set; }

    public string? Llmresponse { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual AppUser User { get; set; } = null!;
}
