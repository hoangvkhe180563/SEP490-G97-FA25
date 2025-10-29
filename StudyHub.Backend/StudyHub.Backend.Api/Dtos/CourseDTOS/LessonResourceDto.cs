namespace StudyHub.Backend.Api.Dtos.LessonResourceDtos;

public class LessonResourceListDto
{
    public int Id { get; set; }
    public string Url { get; set; } = null!;
}

public class LessonResourceCreateDto
{
    public string Url { get; set; } = null!;
}

public class LessonResourceUpdateDto
{
    public int Id { get; set; }
    public string Url { get; set; } = null!;
}
