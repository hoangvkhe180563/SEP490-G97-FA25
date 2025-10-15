namespace StudyHub.Backend.Domain.Entities;

public class LandingPage
{
    public int SchoolId { get; set; }

    public string SchoolLogoUrl { get; set; } = null!;

    public sbyte PrimaryColor { get; set; }
}
