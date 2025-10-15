namespace StudyHub.Backend.Domain.Entities;

public class Province
{
    public short Id { get; set; }

    public string Name { get; set; } = null!;

    public sbyte CityId { get; set; }
}
