using StudyHub.Backend.Domain.Enums;

namespace StudyHub.Backend.Domain.Entities;

public class ClassMember
{
    public Guid UserId { get; set; }

    public int ClassId { get; set; }
    public string Status { get; set; } 

    public DateTime JoinDate { get; set; }
}
