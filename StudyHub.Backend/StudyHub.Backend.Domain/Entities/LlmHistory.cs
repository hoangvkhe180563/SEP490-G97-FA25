namespace StudyHub.Backend.Domain.Entities;

public class LlmHistory
{
    public int Id { get; set; }

    public Guid UserId { get; set; }

    public string? InputText { get; set; }

    public string? Llmresponse { get; set; }

    public DateTime? CreatedAt { get; set; }

    public AppUser? User { get; set; }
}
