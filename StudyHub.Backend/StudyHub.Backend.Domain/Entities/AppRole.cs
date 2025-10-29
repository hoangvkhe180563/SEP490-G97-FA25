namespace StudyHub.Backend.Domain.Entities;

public class AppRole
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public List<AppPolicy> AppPolicies { get; set; } = new();
    public List<AppUser> Users { get; set; } = new List<AppUser>();
}
