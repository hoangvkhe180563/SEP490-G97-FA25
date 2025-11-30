namespace StudyHub.Backend.Domain.Entities;

public class    ClassNotification:IAuditTrail
{
    public int Id { get; set; }

    public int ClassId { get; set; }

    public string Type { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string? Description { get; set; }


    public DateTime? Deadline { get; set; }

    public decimal? MaxScore { get; set; }

    public string? GradeType { get; set; }

    public bool AllowSubmission { get; set; }

    public string? InstructionsHtml { get; set; }
}
