namespace StudyHub.Backend.UseCases.Dtos;

public class CourseQueryParams
{
    public string? Q { get; set; }
    public short? SubjectId { get; set; }
    public string? Subjects { get; set; }
    public string? Sort { get; set; }
    public string? Duration { get; set; }
    public Guid? Instructor { get; set; }
    public sbyte? Grade { get; set; }
    public bool? Status { get; set; }
    public bool? IsFeatured { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 5;
}
