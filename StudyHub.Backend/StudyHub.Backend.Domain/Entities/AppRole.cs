namespace StudyHub.Backend.Domain.Entities;

public class AppRole
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public List<AppClaim> AppClaims { get; set; } = new();
    public List<AppPolicy> AppPolicies { get; set; } = new();
}
