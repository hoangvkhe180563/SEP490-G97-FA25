using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Dtos.AuthDTOS;
using StudyHub.Backend.Api.Dtos.ClassDTOS;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Services;
using System;
using System.Linq;
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
        private readonly AuthService _authService;

        public DocumentController(
            DocumentService documentService,
            AppUserService userService,
            ClassService classService,
            AuthService authService)
        {
            _documentService = documentService;
            _userService = userService;
            _classService = classService;
            _authService = authService;
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
         [FromQuery] string? documentLengthType = null,
         [FromQuery] string? documentLevel = null,
         [FromQuery] int pageNumber = 1,
         [FromQuery] int pageSize = 10)
        {
            var (documents, totalCount) = _documentService.GetPublicDocuments(
                query, categoryId, grade, subject, classId, documentLengthType, documentLevel, pageNumber, pageSize);
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
            [FromQuery] string? documentLengthType = null,
            [FromQuery] string? documentLevel = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            if (currentUser.SchoolId != schoolId)
                return Forbid();

            var (documents, totalCount) = _documentService.GetSchoolDocuments(
                schoolId, query, categoryId, grade, subject, classId, documentLengthType, documentLevel, pageNumber, pageSize);
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
            [FromQuery] string? documentLengthType = null,
            [FromQuery] string? documentLevel = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var (documents, totalCount) = _documentService.GetOwnedDocuments(
                creatorId, query, categoryId, grade, subject, classId, documentLengthType, documentLevel, pageNumber, pageSize);
            return PagedResult(documents.Select(d => d.ToListDto()).ToList(), totalCount, pageNumber, pageSize);
        }
        [HttpGet("school-teachers/{schoolId}")]
public IActionResult GetSchoolTeachersDocuments(
    int schoolId,
    [FromQuery] string? query = null,
    [FromQuery] int? categoryId = null,
    [FromQuery] int? grade = null,
    [FromQuery] string? subject = null,
    [FromQuery] int? classId = null,
    [FromQuery] string? documentLengthType = null,
    [FromQuery] string? documentLevel = null,
    [FromQuery] int pageNumber = 1,
    [FromQuery] int pageSize = 10)
{
    var currentUser = _authService.GetCurrentUser();
    if (currentUser == null)
        return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

    if (currentUser.SchoolId != schoolId)
        return Forbid();

    var (documents, totalCount) = _documentService.GetSchoolTeachersDocuments(
        schoolId, currentUser.Id, query, categoryId, grade, subject, classId, documentLengthType, documentLevel, pageNumber, pageSize);
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
          [FromQuery] bool? hasEditRequest = null,
          [FromQuery] DateTime? createdFrom = null,
          [FromQuery] DateTime? createdTo = null,
          [FromQuery] DateTime? updatedFrom = null,
          [FromQuery] DateTime? updatedTo = null,
          [FromQuery] int pageNumber = 1,
          [FromQuery] int pageSize = 10)
        {
            var (documents, totalCount) = _documentService.GetManagerPublicDocuments(
                query, categoryId, grade, subject, classId, isApproved, status, hasEditRequest, createdFrom, createdTo, updatedFrom, updatedTo, pageNumber, pageSize);
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
    [FromQuery] bool? hasEditRequest = null,
    [FromQuery] DateTime? createdFrom = null,
    [FromQuery] DateTime? createdTo = null,
    [FromQuery] DateTime? updatedFrom = null,
    [FromQuery] DateTime? updatedTo = null,
    [FromQuery] int pageNumber = 1,
    [FromQuery] int pageSize = 10)
        {
            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            if (currentUser.SchoolId != schoolId)
                return Forbid();

            var (documents, totalCount) = _documentService.GetManagerSchoolDocuments(
                schoolId, query, categoryId, grade, subject, classId, isApproved, status, hasEditRequest, createdFrom, createdTo, updatedFrom, updatedTo, pageNumber, pageSize);
            return PagedResult(documents.Select(d => d.ToListDto()).ToList(), totalCount, pageNumber, pageSize);
        }

        [HttpGet("{id:int}")]
        public IActionResult GetDocumentById(int id)
        {
            var document = _documentService.GetDocumentById(id);
            if (document == null)
                return NotFound(new { success = false, message = "Không tìm thấy tài liệu" });

            return Ok(new { success = true, data = document.ToDetailDto() });
        }

        [HttpPost("create")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateDocument([FromForm] CreateDocumentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, errors = ModelState });

            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var document = dto.ToEntity();
            document.CreatedBy = currentUser.Id;

            if (dto.IsInClass == true)
            {
                if (currentUser.SchoolId == null)
                    return BadRequest(new { success = false, message = "Bạn không thuộc trường học nào" });
                document.SchoolId = currentUser.SchoolId;
            }
            else
            {
                document.SchoolId = dto.SchoolId;
            }

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
                            var classItem = JsonSerializer.Deserialize<ClassListDto>(jsonString,
                                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
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

        [HttpPut("update/{id:int}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateDocument(int id, [FromForm] UpdateDocumentDto dto)
        {
            if (id != dto.Id)
                return BadRequest(new { success = false, message = "ID không khớp" });

            if (!ModelState.IsValid)
                return BadRequest(new { success = false, errors = ModelState });

            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var existingDoc = _documentService.GetDocumentById(id);
            if (existingDoc == null)
                return NotFound(new { success = false, message = "Không tìm thấy tài liệu" });

            if (existingDoc.CreatedBy != currentUser.Id)
                return Forbid();

            var document = dto.ToEntity();
            document.UpdatedBy = currentUser.Id;

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
                            var classItem = JsonSerializer.Deserialize<ClassListDto>(jsonString,
                                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
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
        public async Task<IActionResult> DeleteDocument(int id)
        {
            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var existingDoc = _documentService.GetDocumentById(id);
            if (existingDoc == null)
                return NotFound(new { success = false, message = "Không tìm thấy tài liệu" });

            if (existingDoc.CreatedBy != currentUser.Id)
                return Forbid();

            var result = await _documentService.DeleteDocument(id);
            if (!result)
                return NotFound(new { success = false, message = "Xóa thất bại" });

            return Ok(new { success = true, message = "Xóa thành công" });
        }

        [HttpPatch("soft-delete/{id:int}")]
        public async Task<IActionResult> SoftDeleteDocument(int id)
        {
            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var result = await _documentService.SoftDeleteDocument(id, currentUser.Id);
            if (!result)
                return NotFound(new { success = false, message = "Không tìm thấy tài liệu" });

            return Ok(new { success = true, message = "Xóa mềm thành công" });
        }

        [HttpPost("approve")]
        public async Task<IActionResult> ApproveDocument([FromBody] ApprovalDto dto)
        {
            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var document = await _documentService.ApproveDocument(dto.DocumentId, currentUser.Id);
            return Ok(new { success = true, data = document.ToDetailDto() });
        }

        [HttpPost("reject")]
        public async Task<IActionResult> RejectDocument([FromBody] ApprovalDto dto)
        {
            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var document = await _documentService.RejectDocument(dto.DocumentId, currentUser.Id);
            return Ok(new { success = true, data = document.ToDetailDto() });
        }

        [HttpPost("revoke")]
        public async Task<IActionResult> RevokeApproval([FromBody] ApprovalDto dto)
        {
            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var document = await _documentService.RevokeApproval(dto.DocumentId, currentUser.Id);

            return Ok(new { success = true, data = document.ToDetailDto() });
        }

        [HttpPost("toggle-featured")]
        public async Task<IActionResult> ToggleFeatured([FromBody] ToggleFeaturedDto dto)
        {
            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var document = await _documentService.ToggleFeatured(dto.DocumentId, currentUser.Id);
            return Ok(new { success = true, data = document.ToDetailDto() });
        }

        [HttpGet("download/{id:int}")]
        public async Task<IActionResult> DownloadDocument(int id)
        {
            var document = _documentService.GetDocumentById(id);
            if (document == null)
                return NotFound(new { success = false, message = "Không tìm thấy tài liệu" });

            return Ok(new
            {
                success = true,
                data = new
                {
                    url = document.DocumentUrl,
                    fileName = document.Name + Path.GetExtension(document.DocumentUrl)
                }
            });
        }

        [HttpGet("preview/{id:int}")]
        public async Task<IActionResult> PreviewDocument(int id)
        {
            var document =  _documentService.GetDocumentById(id);
            if (document == null)
                return NotFound(new { success = false, message = "Không tìm thấy tài liệu" });

            return Ok(new
            {
                success = true,
                data = new
                {
                    url = document.DocumentUrl,
                    contentType = GetContentType(document.DocumentUrl),
                    fileName = document.Name + Path.GetExtension(document.DocumentUrl)
                }
            });
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

            var result = classes
                .GroupBy(c => c.Id) 
                .Select(g => g.First()) 
                .Select(c =>
                {
                    var teacher = teachers.FirstOrDefault(t => t.Id == c.CreatedBy);
                    return c.ToListClassDto(teacher);
                })
                .ToList();

            return Ok(new { success = true, data = result });
        }

        [HttpGet("GetAllDocumentByClassId/{classId:int}")]
        public IActionResult GetDocumentsByClass(int classId)
        {
            var documents = _documentService.GetDocumentsByClass(classId);
            var dtos = documents.Select(d => d.ToListDto()).ToList();
            return Ok(new { success = true, data = dtos });
        }
        [HttpPost("request-edit")]
        public IActionResult RequestEdit([FromBody] ApprovalDto dto)
        {
            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var document = _documentService.RequestEditDocument(dto.DocumentId, currentUser.Id);
            return Ok(new { success = true, data = document.ToDetailDto() });
        }

        [HttpPost("approve-edit-request")]
        public async Task<IActionResult> ApproveEditRequest([FromBody] ApprovalDto dto)
        {
            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var document = await _documentService.ApproveEditRequest(dto.DocumentId, currentUser.Id);
            return Ok(new { success = true, data = document.ToDetailDto() });
        }

        [HttpPost("reject-edit-request")]
        public async Task<IActionResult> RejectEditRequest([FromBody] ApprovalDto dto)
        {
            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var document = await _documentService.RejectEditRequest(dto.DocumentId, currentUser.Id);
            return Ok(new { success = true, data = document.ToDetailDto() });
        }
        [HttpGet("edit-requests")]
        public IActionResult GetEditRequestDocuments(
    [FromQuery] bool? isRequested = null,
    [FromQuery] int pageNumber = 1,
    [FromQuery] int pageSize = 10)
        {
            var (documents, totalCount) = _documentService.GetEditRequestDocuments(
                isRequested, pageNumber, pageSize);
            return PagedResult(documents.Select(d => d.ToListDto()).ToList(), totalCount, pageNumber, pageSize);
        }
        [HttpGet("GetAllClassesByDocumentId/{documentId:int}/classes")]
        public IActionResult GetClassesByDocument(int documentId)
        {
            var classes = _documentService.GetClassesByDocument(documentId);
            var dtos = classes.Select(c => new ClassListDto { Id = c.Id, Name = c.Name }).ToList();
            return Ok(new { success = true, data = dtos });
        }
        [HttpGet("by-subject/{subjectId:int}")]
        public IActionResult GetDocumentsBySubject(int subjectId)
        {
            List<Document> documents;

            try
            {
                var currentUser = _authService.GetCurrentUser();

                if (currentUser != null && currentUser.SchoolId.HasValue)
                {
                    documents = _documentService.GetDocumentsBySubjectForSchool(subjectId, currentUser.SchoolId.Value);
                }
                else
                {
                    documents = _documentService.GetDocumentsBySubjectForPublic(subjectId);
                }
            }
            catch (InvalidOperationException)
            {
                documents = _documentService.GetDocumentsBySubjectForPublic(subjectId);
            }

            var dtos = documents.Select(d => d.ToListDto()).ToList();
            return Ok(new { success = true, data = dtos });
        }

        [HttpPost("submit-for-approval")]
        public async Task<IActionResult> SubmitForApproval([FromBody] ApprovalDto dto)
        {
            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var document = await _documentService.SubmitForApproval(dto.DocumentId, currentUser.Id);
            return Ok(new { success = true, data = document.ToDetailDto() });
        }
        [HttpPost("cancel-edit-request")]
        public async Task<IActionResult> CancelEditRequest([FromBody] ApprovalDto dto)
        {
            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var document = await _documentService.CancelEditRequest(dto.DocumentId, currentUser.Id);
            return Ok(new { success = true, data = document.ToDetailDto() });
        }
        [HttpPost("{id:int}/ask")]
        public async Task<IActionResult> AskQuestion(int id, [FromBody] AskQuestionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Question))
                return BadRequest(new { success = false, message = "Question is required" });

            var document = _documentService.GetDocumentById(id);
            if (document == null)
                return NotFound(new { success = false, message = "Không tìm thấy tài liệu" });

            try
            {
                var answer = await _documentService.AskDocumentQuestionAsync(id, request.Question);

                var response = new
                {
                    question = answer.Question,
                    answer = answer.Answer,
                    confidence = answer.Confidence,
                    sources = answer.SourceChunks.Select(c => new
                    {
                        pageNumber = c.PageNumber,
                        content = c.Content.Length > 200 ? c.Content.Substring(0, 200) + "..." : c.Content,
                        score = c.Score,
                        characterStart = c.CharacterStart,
                        characterEnd = c.CharacterEnd
                    }).ToList(),
                    tokenUsage = new
                    {
                        promptTokens = answer.PromptTokens,
                        completionTokens = answer.CompletionTokens,
                        totalTokens = answer.PromptTokens + answer.CompletionTokens
                    }
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:int}/chat")]
        public async Task<IActionResult> ChatWithDocument(int id, [FromBody] ChatWithDocumentRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Question))
                return BadRequest(new { success = false, message = "Question is required" });

            var document = _documentService.GetDocumentById(id);
            if (document == null)
                return NotFound(new { success = false, message = "Không tìm thấy tài liệu" });

            try
            {
                var history = request.ConversationHistory?.Select(h => new ConversationTurn
                {
                    Question = h.Question,
                    Answer = h.Answer,
                    Timestamp = h.Timestamp
                }).ToList() ?? new List<ConversationTurn>();

                var answer = await _documentService.ContinueDocumentConversationAsync(id, request.Question, history);

                var response = new
                {
                    question = answer.Question,
                    answer = answer.Answer,
                    confidence = answer.Confidence,
                    sources = answer.SourceChunks.Select(c => new
                    {
                        pageNumber = c.PageNumber,
                        content = c.Content.Length > 200 ? c.Content.Substring(0, 200) + "..." : c.Content,
                        score = c.Score
                    }).ToList(),
                    tokenUsage = new
                    {
                        promptTokens = answer.PromptTokens,
                        completionTokens = answer.CompletionTokens,
                        totalTokens = answer.PromptTokens + answer.CompletionTokens
                    }
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:int}/index-rag")]
        public async Task<IActionResult> IndexDocumentForRAG(int id)
        {
            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var document = _documentService.GetDocumentById(id);
            if (document == null)
                return NotFound(new { success = false, message = "Không tìm thấy tài liệu" });

            if (document.CreatedBy != currentUser.Id)
                return Forbid();

            try
            {
                var result = await _documentService.ReindexDocumentForRAGAsync(id);

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Đánh chỉ mục RAG thành công",
                        data = new
                        {
                            documentId = result.DocumentId,
                            documentName = result.DocumentName,
                            totalChunks = result.TotalChunks,
                            processingTimeSeconds = result.ProcessingTimeSeconds
                        }
                    });
                }
                else
                {
                    return StatusCode(500, new
                    {
                        success = false,
                        message = $"Đánh chỉ mục thất bại: {result.ErrorMessage}"
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id:int}/rag-stats")]
        [Produces("application/json")]
        public async Task<IActionResult> GetRAGStats(int id)
        {
            var document = _documentService.GetDocumentById(id);
            if (document == null)
                return NotFound(new { success = false, message = "Không tìm thấy tài liệu" });

            try
            {
                var stats = await _documentService.GetDocumentRAGStatsAsync(id);

                Response.ContentType = "application/json";

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        documentId = stats.DocumentId,
                        totalChunks = stats.TotalChunks,
                        totalPages = stats.TotalPages,
                        totalCharacters = stats.TotalCharacters,
                        lastIndexed = stats.LastIndexed,
                        isIndexed = stats.TotalChunks > 0
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("init-rag-index")]
        public async Task<IActionResult> InitRAGIndex()
        {
            try
            {
                var elasticContentService = HttpContext.RequestServices
                    .GetRequiredService<ElasticDocumentContentService>();

                var result = await elasticContentService.CreateIndexAsync();

                if (result)
                {
                    return Ok(new { success = true, message = "RAG index created successfully" });
                }
                else
                {
                    return StatusCode(500, new { success = false, message = "Failed to create RAG index" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
        [HttpDelete("clear-all-rag-content")]
        public async Task<IActionResult> ClearAllRAGContent()
        {
            try
            {
                var elasticContentService = HttpContext.RequestServices
                    .GetRequiredService<ElasticDocumentContentService>();

                var countBefore = await elasticContentService.GetTotalDocumentCountAsync();
                var result = await elasticContentService.ClearAllDocumentContentsAsync();

                if (result)
                {
                    return Ok(new
                    {
                        success = true,
                        message = $"Cleared {countBefore} document chunks from RAG index",
                        deletedCount = countBefore
                    });
                }
                else
                {
                    return StatusCode(500, new
                    {
                        success = false,
                        message = "Failed to clear RAG content"
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}