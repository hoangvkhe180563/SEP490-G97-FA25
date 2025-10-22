using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Dtos.ClassDTOS;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.UseCases.Services;
using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;

namespace StudyHub.Backend.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentController : ControllerBase
    {
        private readonly DocumentService _documentService;
        private readonly AppUserService _userService;
        private readonly ClassService _classService;
        public DocumentController(DocumentService documentService, AppUserService userService, ClassService classService)
        {
            _documentService = documentService;
            _userService = userService;
            _classService = classService;
        }

        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? User.FindFirst("sub")?.Value
                              ?? User.FindFirst("id")?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return null;

            return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
        }

        private IActionResult PagedResult<T>(List<T> items, int total, int page, int limit)
        {
            return Ok(new
            {
                success = true,
                data = new StudyHub.Backend.UseCases.Dtos.PagedResult<T>
                {
                    Items = items,
                    Total = total,
                    Page = page,
                    Limit = limit,
                    TotalPages = (int)Math.Ceiling(total / (double)limit)
                }
            });
        }

        [HttpGet("public")]
        public IActionResult GetPublicDocuments(
            [FromQuery] string? query = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] int? grade = null,
            [FromQuery] string? subject = null,
            [FromQuery] int? classId = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var (documents, totalCount) = _documentService.GetPublicDocuments(
                query, categoryId, grade, subject, classId, pageNumber, pageSize);
            return PagedResult(documents.Select(d => d.ToListDto()).ToList(), totalCount, pageNumber, pageSize);
        }

        [HttpGet("school/{schoolId}")]
        public IActionResult GetSchoolDocuments(
            int schoolId,
            [FromQuery] string? query = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] int? grade = null,
            [FromQuery] string? subject = null,
            [FromQuery] int? classId = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var (documents, totalCount) = _documentService.GetSchoolDocuments(
                schoolId, query, categoryId, grade, subject, classId, pageNumber, pageSize);
            return PagedResult(documents.Select(d => d.ToListDto()).ToList(), totalCount, pageNumber, pageSize);
        }

        [HttpGet("owned/{creatorId}")]
        public IActionResult GetOwnedDocuments(
            Guid creatorId,
            [FromQuery] string? query = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] int? grade = null,
            [FromQuery] string? subject = null,
            [FromQuery] int? classId = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            // var currentUserId = GetCurrentUserId();
            // if (!currentUserId.HasValue)
            //     return Unauthorized(new { success = false });
            // var (documents, totalCount) = _documentService.GetOwnedDocuments(
            //     currentUserId.Value, query, categoryId, grade, subject, classId, pageNumber, pageSize);

            var (documents, totalCount) = _documentService.GetOwnedDocuments(
                creatorId, query, categoryId, grade, subject, classId, pageNumber, pageSize);
            return PagedResult(documents.Select(d => d.ToListDto()).ToList(), totalCount, pageNumber, pageSize);
        }

        [HttpGet("manager/public")]
        public IActionResult GetManagerPublicDocuments(
            [FromQuery] string? query = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] int? grade = null,
            [FromQuery] string? subject = null,
            [FromQuery] int? classId = null,
            [FromQuery] bool? isApproved = null,
            [FromQuery] bool? status = null,
            [FromQuery] bool? isPending = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var (documents, totalCount) = _documentService.GetManagerPublicDocuments(
                query, categoryId, grade, subject, classId, isApproved, status, pageNumber, pageSize);
            return PagedResult(documents.Select(d => d.ToListDto()).ToList(), totalCount, pageNumber, pageSize);
        }

        [HttpGet("manager/school/{schoolId}")]
        public IActionResult GetManagerSchoolDocuments(
            int schoolId,
                [FromQuery] string? query = null,
                [FromQuery] int? categoryId = null,
                [FromQuery] int? grade = null,
                [FromQuery] string? subject = null,
                [FromQuery] int? classId = null,
                [FromQuery] bool? isApproved = null,
                [FromQuery] bool? status = null,
                [FromQuery] bool? isPending = null,
                [FromQuery] int pageNumber = 1,
                [FromQuery] int pageSize = 10)
        {
            var (documents, totalCount) = _documentService.GetManagerSchoolDocuments(
                schoolId, query, categoryId, grade, subject, classId, isApproved, status, pageNumber, pageSize);
            return PagedResult(documents.Select(d => d.ToListDto()).ToList(), totalCount, pageNumber, pageSize);
        }

        [HttpGet("{id:int}")]
        public IActionResult GetDocumentById(int id)
        {
            var document = _documentService.GetDocumentById(id);
            if (document == null)
                return NotFound(new { success = false });

            return Ok(new { success = true, data = document.ToDetailDto() });
        }

        //[HttpPost("create")]
        //[Consumes("multipart/form-data")]
        //public async Task<IActionResult> CreateDocument([FromForm] CreateDocumentDto dto)
        //{
        //    if (!ModelState.IsValid)
        //        return BadRequest(new { success = false, errors = ModelState });

        //    // var currentUserId = GetCurrentUserId();
        //    // if (!currentUserId.HasValue)
        //    //     return Unauthorized(new { success = false });
        //    // 
        //    // var userInfo = _userService.GetUserById(currentUserId.Value);
        //    // if (userInfo == null)
        //    //     return Unauthorized(new { success = false });
        //    // 
        //    // var document = dto.ToEntity();
        //    // document.CreatedBy = currentUserId.Value;
        //    // 
        //    // if (dto.IsInClass == true)
        //    // {
        //    //     if (userInfo.SchoolId == null)
        //    //         return BadRequest(new { success = false });
        //    //     document.SchoolId = userInfo.SchoolId;
        //    // }
        //    // else
        //    // {
        //    //     document.SchoolId = dto.SchoolId;
        //    // }
        //    var document = dto.ToEntity();
        //    document.Classes = dto.classes?.Select(c => new Domain.Entities.Class { Id = c.Id }).ToList() ?? new List<Domain.Entities.Class>();

        //    var createdDocument = await _documentService.CreateDocumentAsync(
        //        document, dto.DocumentFile, dto.ThumbnailFile);

        //    return CreatedAtAction(nameof(GetDocumentById), new { id = createdDocument.Id },
        //        new { success = true, data = createdDocument.ToDetailDto() });

        //}
        [HttpPost("create")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateDocument([FromForm] CreateDocumentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, errors = ModelState });

            var document = dto.ToEntity();

            // Lấy tất cả giá trị classes từ form (dù tên là classes hay classesJson)
            var classesValues = Request.Form["classes"];
            if (classesValues.Count == 0)
                classesValues = Request.Form["classesJson"];

            if (classesValues.Count > 0)
            {
                var classList = new List<ClassListDto>();
                foreach (var jsonString in classesValues)
                {
                    try
                    {
                        if (!string.IsNullOrEmpty(jsonString))
                        {
                            var classItem = System.Text.Json.JsonSerializer.Deserialize<ClassListDto>(jsonString,
                                new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                            if (classItem != null)
                                classList.Add(classItem);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error parsing class JSON: {ex.Message}");
                    }
                }
                document.Classes = classList.Select(c => new Domain.Entities.Class { Id = c.Id }).ToList();
            }
            else
            {
                document.Classes = dto.classes?.Select(c => new Domain.Entities.Class { Id = c.Id }).ToList()
                                   ?? new List<Domain.Entities.Class>();
            }

            var createdDocument = await _documentService.CreateDocumentAsync(
                document, dto.DocumentFile, dto.ThumbnailFile);

            return CreatedAtAction(nameof(GetDocumentById), new { id = createdDocument.Id },
                new { success = true, data = createdDocument.ToDetailDto() });
        }
        //[HttpPut("{id:int}")]
        //[Consumes("multipart/form-data")]
        //public async Task<IActionResult> UpdateDocument(int id, [FromForm] UpdateDocumentDto dto)
        //{
        //    if (id != dto.Id)
        //        return BadRequest(new { success = false });

        //    if (!ModelState.IsValid)
        //        return BadRequest(new { success = false, errors = ModelState });

        //    // var currentUserId = GetCurrentUserId();
        //    // if (!currentUserId.HasValue)
        //    //     return Unauthorized(new { success = false });
        //    // 
        //    // var existingDoc = _documentService.GetDocumentById(id);
        //    // if (existingDoc == null)
        //    //     return NotFound(new { success = false });
        //    // 
        //    // if (existingDoc.CreatedBy != currentUserId.Value)
        //    //     return Forbid();
        //    // 
        //    // var document = dto.ToEntity();
        //    // document.UpdatedBy = currentUserId.Value;

        //    var document = dto.ToEntity();
        //    document.Classes = dto.classes?.Select(c => new Domain.Entities.Class { Id = c.Id }).ToList() ?? new List<Domain.Entities.Class>();

        //    var updatedDocument = await _documentService.UpdateDocumentAsync(
        //        document, dto.DocumentFile, dto.ThumbnailFile);

        //    return Ok(new { success = true, data = updatedDocument.ToDetailDto() });
        //}
        [HttpPut("{id:int}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateDocument(int id, [FromForm] UpdateDocumentDto dto)
        {
            if (id != dto.Id)
                return BadRequest(new { success = false });

            if (!ModelState.IsValid)
                return BadRequest(new { success = false, errors = ModelState });

            var document = dto.ToEntity();

            // Lấy tất cả giá trị classes từ form (dù tên là classes hay classesJson)
            var classesValues = Request.Form["classes"];
            if (classesValues.Count == 0)
                classesValues = Request.Form["classesJson"];

            if (classesValues.Count > 0)
            {
                var classList = new List<ClassListDto>();
                foreach (var jsonString in classesValues)
                {
                    try
                    {
                        if (!string.IsNullOrEmpty(jsonString))
                        {
                            var classItem = System.Text.Json.JsonSerializer.Deserialize<ClassListDto>(jsonString,
                                new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                            if (classItem != null)
                                classList.Add(classItem);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error parsing class JSON: {ex.Message}");
                    }
                }
                document.Classes = classList.Select(c => new Domain.Entities.Class { Id = c.Id }).ToList();
            }
            else
            {
                document.Classes = dto.classes?.Select(c => new Domain.Entities.Class { Id = c.Id }).ToList()
                                   ?? new List<Domain.Entities.Class>();
            }

            var updatedDocument = await _documentService.UpdateDocumentAsync(
                document, dto.DocumentFile, dto.ThumbnailFile);

            return Ok(new { success = true, data = updatedDocument.ToDetailDto() });
        }
        [HttpDelete("{id:int}")]
        public IActionResult DeleteDocument(int id)
        {
            // var currentUserId = GetCurrentUserId();
            // if (!currentUserId.HasValue)
            //     return Unauthorized(new { success = false });
            // 
            // var existingDoc = _documentService.GetDocumentById(id);
            // if (existingDoc == null)
            //     return NotFound(new { success = false });
            // 
            // if (existingDoc.CreatedBy != currentUserId.Value)
            //     return Forbid();

            var result = _documentService.DeleteDocument(id);
            if (!result)
                return NotFound(new { success = false });

            return Ok(new { success = true });
        }

        [HttpPatch("soft-delete/{id:int}")]
        public IActionResult SoftDeleteDocument(int id, [FromBody] Guid deletedBy)
        {
            // var currentUserId = GetCurrentUserId();
            // if (!currentUserId.HasValue)
            //     return Unauthorized(new { success = false });
            // var result = _documentService.SoftDeleteDocument(id, currentUserId.Value);

            var result = _documentService.SoftDeleteDocument(id, deletedBy);
            if (!result)
                return NotFound(new { success = false });

            return Ok(new { success = true });
        }

        [HttpPost("approve")]
        public IActionResult ApproveDocument([FromBody] ApprovalDto dto)
        {
            // var currentUserId = GetCurrentUserId();
            // if (!currentUserId.HasValue)
            //     return Unauthorized(new { success = false });
            // var document = _documentService.ApproveDocument(dto.DocumentId, currentUserId.Value);

            var document = _documentService.ApproveDocument(dto.DocumentId, dto.ApprovedBy);
            return Ok(new { success = true, data = document.ToDetailDto() });
        }

        [HttpPost("reject")]
        public IActionResult RejectDocument([FromBody] ApprovalDto dto)
        {
            // var currentUserId = GetCurrentUserId();
            // if (!currentUserId.HasValue)
            //     return Unauthorized(new { success = false });
            // var document = _documentService.RejectDocument(dto.DocumentId, currentUserId.Value);

            var document = _documentService.RejectDocument(dto.DocumentId, dto.ApprovedBy);
            return Ok(new { success = true, data = document.ToDetailDto() });
        }

        [HttpPost("revoke")]
        public IActionResult RevokeApproval([FromBody] ApprovalDto dto)
        {
            // var currentUserId = GetCurrentUserId();
            // if (!currentUserId.HasValue)
            //     return Unauthorized(new { success = false });
            // var document = _documentService.RevokeApproval(dto.DocumentId, currentUserId.Value);

            var document = _documentService.RevokeApproval(dto.DocumentId, dto.ApprovedBy);
            return Ok(new { success = true, data = document.ToDetailDto() });
        }

        [HttpPost("toggle-featured")]
        public IActionResult ToggleFeatured([FromBody] ToggleFeaturedDto dto)
        {
            // var currentUserId = GetCurrentUserId();
            // if (!currentUserId.HasValue)
            //     return Unauthorized(new { success = false });
            // var document = _documentService.ToggleFeatured(dto.DocumentId, currentUserId.Value);

            var document = _documentService.ToggleFeatured(dto.DocumentId, dto.UpdatedBy);
            return Ok(new { success = true, data = document.ToDetailDto() });
        }

        [HttpGet("download/{id:int}")]
        public async Task<IActionResult> DownloadDocument(int id)
        {
            var document = _documentService.GetDocumentById(id);
            if (document == null)
                return NotFound(new { success = false });

            var stream = await _documentService.StreamDocumentAsync(document);
            var contentType = GetContentType(document.DocumentUrl);
            var fileName = document.Name + Path.GetExtension(document.DocumentUrl);

            return File(stream, contentType, fileName);
        }

        [HttpGet("preview/{id:int}")]
        public async Task<IActionResult> PreviewDocument(int id)
        {
            var document = _documentService.GetDocumentById(id);
            if (document == null)
                return NotFound(new { success = false });

            var stream = await _documentService.StreamDocumentAsync(document);
            var contentType = GetContentType(document.DocumentUrl);

            Response.Headers.Add("Accept-Ranges", "bytes");
            Response.Headers.Add("Cache-Control", "public, max-age=31536000");

            return File(stream, contentType, enableRangeProcessing: true);
        }

        private string GetContentType(string filePath)
        {
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".ppt" => "application/vnd.ms-powerpoint",
                ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ".txt" => "text/plain",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".zip" => "application/zip",
                ".rar" => "application/x-rar-compressed",
                _ => "application/octet-stream"
            };
        }
        [HttpGet("my-class/{userid:guid}")]
        public IActionResult GetClassByUserId(Guid userid)
        {
            var classes = _classService.GetClassByUserId(userid);
            var subjects = _classService.GetSubjects();
            var teachers = _classService.GetTeachers();

            var result = classes.Select(c => {
                var subject = subjects.FirstOrDefault(s => s.Id == c.SubjectId);
                var teacher = teachers.FirstOrDefault(t => t.Id == c.CreatedBy);
                return c.ToListClassDto(teacher, subject);
            }).ToList();

            return Ok(result);
        }
        [HttpGet("by-subject/{subjectId:int}")]
        public IActionResult GetDocumentsBySubject(int subjectId)
        {
            var documents = _documentService.GetDocumentsBySubject(subjectId);
            var dtos = documents.Select(d => d.ToListDto()).ToList();
            return Ok(new { success = true, data = dtos });
        }
    }
}