namespace StudyHub.Backend.Domain.Entities.ElasticSearch
{
    public class ElasticDocument
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string DocumentUrl { get; set; } = null!;
        public string? Thumbnail { get; set; }
        public int? SchoolId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public string DocumentLengthType { get; set; } = null!;
        public string DocumentLevel { get; set; } = null!;
        public string DocumentCategoryName { get; set; } = string.Empty;
        public string DocumentCategoryDescription { get; set; } = string.Empty;
        public int Grade { get; set; }
        public bool IsInClass { get; set; }
        public bool? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public float[] DocumentVector { get; set; } = Array.Empty<float>();
        public string SearchableText { get; set; } = string.Empty;
    }
}
