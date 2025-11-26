using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Api.Dtos.CourseDTOS;
using StudyHub.Backend.UseCases.Dtos;
using Microsoft.AspNetCore.Http.HttpResults;

namespace StudyHub.Backend.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CourseController : ControllerBase
{
    private readonly CourseService _service;
    private readonly CloudFileStorageService _fileStorage;
    private readonly ElasticCourseVectorSearchService _elasticsearchService;

    public CourseController(CourseService service, CloudFileStorageService fileStorage, ElasticCourseVectorSearchService elasticsearchService)
    {
        _service = service;
        _fileStorage = fileStorage;
        _elasticsearchService = elasticsearchService;
    }

    // ===================== GET ALL =====================
    [HttpGet]
    public IActionResult GetAll(
        [FromQuery] string? q,
        [FromQuery] short? subjectId,
        [FromQuery] int schoolId,
        [FromQuery] sbyte? grade,
        [FromQuery] int? minDuration,
        [FromQuery] int? maxDuration,
        [FromQuery] Guid? instructor,
        [FromQuery] string? status,
        [FromQuery] bool? isFeatured,
        [FromQuery] bool? isApproved,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = new CourseQueryParams
        {
            Q = q,
            SubjectId = subjectId,
            SchoolId = schoolId,
            Sort = sort,
            Grade = grade,
            minDuration = minDuration,
            maxDuration = maxDuration,
            Instructor = instructor,
            Status = status,
            IsFeatured = isFeatured,
            IsApproved = isApproved,
            Page = page,
            PageSize = pageSize
        };

        var result = _service.GetAllCourses(query);

        var dto = new PagedResult<CourseListDto>
        {
            Items = result.Items.Select(i => i.ToListDto()).ToList(),
            Total = result.Total,
            Page = result.Page,
            Limit = result.Limit,
            TotalPages = result.TotalPages
        };

        return Ok(dto);
    }

    // ===================== GET BY ID =====================
    [HttpGet("{id}")]
    public IActionResult Get(int id)
    {
        var course = _service.GetCourse(id);
        if (course == null) return NotFound();
        return Ok(course.ToListDto());
    }

    // ===================== CREATE =====================
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CourseDto dto)
    {
        if (dto == null)
            return BadRequest("Course data is required.");

        var entity = dto.ToEntity();
        var created = await _service.CreateCourse(entity);

        return CreatedAtAction(nameof(Get), new { id = created.Id }, created.ToListDto());
    }

    // ===================== UPDATE =====================
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CourseDto dto)
    {
        if (dto == null)
            return BadRequest("Course data is required.");

        var existing = _service.GetCourse(id);
        if (existing == null)
            return NotFound();

        // --- Update all fields from the new DTO ---
        existing.Name = dto.Name;
        existing.Information = dto.Information;
        existing.ImageUrl = dto.ImageUrl;
        existing.Price = dto.Price;
        existing.Grade = dto.Grade;
        existing.SubjectId = dto.SubjectId;
        existing.SchoolId = dto.SchoolId;
        existing.IsFeatured = dto.IsFeatured;
        existing.Status = dto.Status;
        existing.StartAt = dto.StartAt;
        existing.EndAt = dto.EndAt;
        // Difficulty & Length
        existing.Difficulty = System.Enum.TryParse<StudyHub.Backend.Domain.Entities.CourseDifficulty>(dto.Difficulty, true, out var _d) ? _d : existing.Difficulty;
        existing.Length = System.Enum.TryParse<StudyHub.Backend.Domain.Entities.CourseLength>(dto.Length, true, out var _l) ? _l : existing.Length;
        existing.UpdatedAt = DateTime.Now;
        existing.UpdatedBy = dto.UpdatedBy;
        existing.IsApproved = dto.IsApproved;

        // Chapters
        if (dto.Chapters != null && dto.Chapters.Any())
        {
            existing.Chapters = dto.Chapters.Select(ch => ch.ToEntity()).ToList();
        }

        var updated = await _service.UpdateCourse(existing);

        return Ok(updated.ToDto());
    }

    // ===================== DELETE =====================
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _service.DeleteCourse(id);
        if (!ok)
            return NotFound();

        return NoContent();
    }

    [HttpGet("school/{schoolId}")]
    public IActionResult GetSchoolCourses(int schoolId)
    {
        var courses = _service.GetCourseBySchool(schoolId);
        var courseDto = courses.ToDisplayDto();
        return Ok(courseDto);
    }

    [HttpPost("upload-thumbnail")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadThumbnail([FromForm] UploadThumbnailDto dto)
    {
        var file = dto.File;
        if (file == null || file.Length == 0)
            return BadRequest("File is required");

        try
        {
            var path = UseCases.Utils.FileConstants.CourseThumbnailUploadPath;
            var url = await _fileStorage.UploadFileAsync(file, path);
            if (string.IsNullOrEmpty(url))
                return StatusCode(500, "Upload failed");

            return Ok(new { url });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

}
