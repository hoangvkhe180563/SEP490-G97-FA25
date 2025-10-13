using System.Collections.Generic;

namespace StudyHub.Backend.Domain.Entities
{
    public class Accessibility
    {
        public sbyte Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<Document> Documents { get; set; } = new();
    }
}
