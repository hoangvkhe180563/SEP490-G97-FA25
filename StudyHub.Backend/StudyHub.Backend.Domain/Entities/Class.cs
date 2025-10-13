using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Domain.Entities
{
    public class Class
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public short? SubjectId { get; set; }
        public string? Description { get; set; }
        public bool Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public DateTime? DeletedAt { get; set; }

        public List<AppClaim> AppClaims { get; set; } = new();
        public List<ClassMember> ClassMembers { get; set; } = new();
        public List<Classwork> Classworks { get; set; } = new();
        public Subject? Subject { get; set; }
    }
}
