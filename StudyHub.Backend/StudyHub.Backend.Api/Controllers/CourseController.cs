using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using StudyHub.Backend.Api.Dtos.CourseDTOS;
using StudyHub.Backend.Api.Hubs;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CourseController : ControllerBase
{
    private readonly CourseService _service;
    private readonly CloudFileStorageService _fileStorage;
    private readonly ElasticCourseVectorSearchService _elasticsearchService;
    private readonly AuthService _authService;
    private readonly NotificationService _notificationService;
    private readonly IHubContext<NotificationHub> _notificationHub;

    public CourseController(CourseService service, CloudFileStorageService fileStorage, ElasticCourseVectorSearchService elasticsearchService, NotificationService notification, IHubContext<NotificationHub> hub)
    {
        _service = service;
        _fileStorage = fileStorage;
        _elasticsearchService = elasticsearchService;
        _notificationService = notification;
        _notificationHub = hub;
    }

    // ===================== GET ALL =====================
    [HttpGet]
    public IActionResult GetAll(
        [FromQuery] string? q,
        [FromQuery] short? subjectId,
        [FromQuery] int schoolId,
        [FromQuery] bool? publicOnly,
        [FromQuery] sbyte? grade,
        [FromQuery] string? difficulty,
        [FromQuery] string? length,
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
            PublicOnly = publicOnly,
            Sort = sort,
            Difficulty = difficulty,
            Length = length,
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
        try
        {
            // Extracted notification logic into a separate method
            await SendCourseCreatedNotificationsAsync(created, HttpContext.RequestAborted);
        }
        catch (Exception ex)
        {
            // non-fatal: do not fail creation if notifications fail
            Console.WriteLine($"Create-course notification error: {ex.Message}");
        }
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
    private async Task SendCourseCreatedNotificationsAsync(Course created, CancellationToken ct)
    {
        if (created == null) return;

        var currentUser = _authService.GetCurrentUser();
        var title = $"Khóa học mới: {created?.Name}";
        var body = $"Khóa học '{created?.Name}' vừa được tạo.";
        var link = $"/course/{created?.Id}";

        // 1) Personal notification to the creator (if available)
        if (currentUser != null && currentUser.Id != Guid.Empty)
        {
            try
            {
                var savedPersonal = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                    title: title,
                    body: body,
                    targetType: "User",
                    targetGroupId: null,
                    targetUserId: currentUser.Id,
                    recipientUserIds: new[] { currentUser.Id },
                    createdBy: currentUser.Id,
                    linkUrl: link,
                    priority: "Normal",
                    ct: ct
                );

                if (savedPersonal != null)
                {
                    try
                    {
                        var payload = new
                        {
                            id = savedPersonal.Id,
                            title = savedPersonal.Title,
                            body = savedPersonal.Body,
                            linkUrl = link,
                            priority = savedPersonal.Priority,
                            targetType = savedPersonal.TargetType,
                            targetUserId = savedPersonal.TargetUserId,
                            createdAt = savedPersonal.CreatedAt,
                            createdBy = savedPersonal.CreatedBy,
                            isRead = false
                        };
                        await _notificationHub.Clients.Group($"user_{currentUser.Id}").SendAsync("NotificationCreated", payload, ct);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Broadcast personal create-course notification failed: {ex.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Create personal create-course notification failed: {ex.Message}");
            }
        }

        // 2) Notify students in the same school (if schoolId available)
        int? schoolId = created?.SchoolId;
        if (schoolId.HasValue)
        {
            try
            {
                var (studentGroupId, studentIds) = await _notificationService.EnsureCompositeGroupAsync(
                    schoolId: schoolId,
                    roleNames: new[] { "Student" },
                    classId: null,
                    grade: null,
                    explicitUserIds: null,
                    customName: $"Students-{schoolId}",
                    createdBy: currentUser?.Id ?? Guid.Empty,
                    ct: ct
                );

                if (studentIds != null && studentIds.Any())
                {
                    var savedStudents = await _notificationService.CreateAndSendNotificationToRecipientsAsync(
                        title: title,
                        body: body,
                        targetType: "Group",
                        targetGroupId: studentGroupId,
                        targetUserId: null,
                        recipientUserIds: studentIds,
                        createdBy: currentUser?.Id ?? Guid.Empty,
                        linkUrl: link,
                        priority: "Normal",
                        ct: ct
                    );

                    if (savedStudents != null)
                    {
                        try
                        {
                            var targets = studentIds.Select(id => $"user_{id}").ToArray();
                            var payload = new
                            {
                                id = savedStudents.Id,
                                title = savedStudents.Title,
                                body = savedStudents.Body,
                                linkUrl = link,
                                priority = savedStudents.Priority,
                                targetType = savedStudents.TargetType,
                                targetGroupId = savedStudents.TargetGroupId,
                                createdAt = savedStudents.CreatedAt,
                                createdBy = savedStudents.CreatedBy,
                                isRead = false
                            };
                            await _notificationHub.Clients.Groups(targets).SendAsync("NotificationCreated", payload, ct);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Broadcast to students failed: {ex.Message}");
                        }
                    }
                }
                else
                {
                    Console.WriteLine($"No students found for school {schoolId} to notify.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Create/send students notification failed: {ex.Message}");
            }
        }

    }
}
