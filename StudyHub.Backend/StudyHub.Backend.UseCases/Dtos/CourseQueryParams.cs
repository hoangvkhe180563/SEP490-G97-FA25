namespace StudyHub.Backend.UseCases.Dtos;

public class CourseQueryParams
{
    public string? Q { get; set; }
    public short? SubjectId { get; set; }
    public int SchoolId { get; set; }
    public string? Sort { get; set; }
    public string? Difficulty { get; set; }
    public string? Length { get; set; }
    public int? minDuration { get; set; }
    public int? maxDuration { get; set; }
    public Guid? Instructor { get; set; }
    public sbyte? Grade { get; set; }
    public string? Status { get; set; }
    public bool? IsFeatured { get; set; }
    public bool? IsApproved { get; set; }
    public bool? PublicOnly { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 5;
}
