using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Domain.Entities
{
    public class Classwork
    {
        public int Id { get; set; }
        public int ClassId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? Deadline { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }

        public Class? Class { get; set; }
        public List<ClassworkSubmission> ClassworkSubmissions { get; set; } = new();
    }
}
