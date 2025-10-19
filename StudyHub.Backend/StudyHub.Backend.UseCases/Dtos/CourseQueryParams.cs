namespace StudyHub.Backend.UseCases.Dtos;

public class CourseQueryParams
{
    public string? Q { get; set; }
    // single subject id (legacy) - keep for backward compat
    public short? SubjectId { get; set; }
    // optional comma-separated subject ids (e.g. "1,2,3")
    public string? Subjects { get; set; }
    // sorting: e.g. "newest", "priceAsc", "priceDesc"
    public string? Sort { get; set; }
    public sbyte? Grade { get; set; }
    public bool? Status { get; set; }
    public bool? IsFeatured { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 5;
}
