namespace StudyHub.Backend.Domain.Entities.ElasticSearch
{
    public class ElasticCourse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public uint Price { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid CreatedById { get; set; }
        public string Information { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int? SchoolId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public string Length { get; set; } = string.Empty;
        public int Grade { get; set; }
        public float[] CourseVector { get; set; } = Array.Empty<float>();
        public string SearchableText { get; set; } = string.Empty;
    }
}
