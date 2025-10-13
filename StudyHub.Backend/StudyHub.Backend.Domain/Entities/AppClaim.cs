using System;

namespace StudyHub.Backend.Domain.Entities
{
    public class AppClaim
    {
        public Guid UserId { get; set; }
        public Guid RoleId { get; set; }
        public short SubjectId { get; set; }
        public int ClassId { get; set; }

        public Class? Class { get; set; }
        public AppRole? Role { get; set; }
        public Subject? Subject { get; set; }
        public AppUser? User { get; set; }
    }
}
