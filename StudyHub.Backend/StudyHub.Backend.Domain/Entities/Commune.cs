namespace StudyHub.Backend.Domain.Entities;

public class Commune
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public sbyte CityId { get; set; }
}
