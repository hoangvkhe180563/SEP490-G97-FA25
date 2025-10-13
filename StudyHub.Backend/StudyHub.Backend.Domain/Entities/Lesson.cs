namespace StudyHub.Backend.Domain.Entities
{
    public class Lesson
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsPreview { get; set; }
        public int ChapterId { get; set; }
        public bool? Status { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }
}
