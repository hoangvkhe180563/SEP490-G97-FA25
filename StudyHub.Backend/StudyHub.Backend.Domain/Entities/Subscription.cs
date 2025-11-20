using System;

namespace StudyHub.Backend.Domain.Entities;

public class Subscription
{
    public int Id { get; set; }
    public Guid AppUserId { get; set; }
    public string PackageName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
