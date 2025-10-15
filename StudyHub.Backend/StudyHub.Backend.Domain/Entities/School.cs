namespace StudyHub.Backend.Domain.Entities;

public class School
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string Address { get; set; } = null!;

    public int CommuneId { get; set; }
}
