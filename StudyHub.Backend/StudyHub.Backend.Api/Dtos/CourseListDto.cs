namespace StudyHub.Backend.Api.Dtos;

public class CourseListDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Information { get; set; }
    public string? ImageUrl { get; set; }
    public uint Price { get; set; }
}
