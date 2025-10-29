
namespace StudyHub.Backend.Domain.Entities;

public class ClassMember
{
    public Guid UserId { get; set; }

    public int ClassId { get; set; }

    public DateTime JoinDate { get; set; }

    public string Status { get; set; } = null!;

    public virtual Class Class { get; set; } = null!;

    public virtual AppUser User { get; set; } = null!;
}
