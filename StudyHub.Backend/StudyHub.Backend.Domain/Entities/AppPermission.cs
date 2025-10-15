namespace StudyHub.Backend.Domain.Entities;

public class AppPermission
{
    public Guid RoleId { get; set; }

    public int ResourceId { get; set; }

    public int ActionId { get; set; }

    public AppAction? Action { get; set; }
    public AppResource? Resource { get; set; }
    public AppRole? Role { get; set; }
}
