namespace StudyHub.Backend.UseCases.Dtos;

public class CourseQueryParams
{
    public string? Q { get; set; }
    public short? SubjectId { get; set; }
    public sbyte? Grade { get; set; }
    public bool? Status { get; set; }
    public bool? IsFeatured { get; set; }
    public string? SortBy { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}
