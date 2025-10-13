using System.Collections.Generic;

namespace StudyHub.Backend.Domain.Entities
{
    public class Chapter
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public bool? Status { get; set; }
        public List<Lesson> Lessons { get; set; } = new();
    }
}
