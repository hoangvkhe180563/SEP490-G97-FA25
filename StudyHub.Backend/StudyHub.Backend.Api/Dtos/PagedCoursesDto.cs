using System.Collections.Generic;

namespace StudyHub.Backend.Api.Dtos;

public class PagedCoursesDto
{
    public List<CourseListDto> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
