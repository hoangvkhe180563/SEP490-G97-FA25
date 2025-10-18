using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.UseCases.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace StudyHub.Backend.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentController : ControllerBase
    {
        private readonly DocumentService _documentService;

        public DocumentController(DocumentService documentService)
        {
            _documentService = documentService;
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

        [HttpPost("create")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateDocument([FromForm] CreateDocumentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, errors = ModelState });

            var document = dto.ToEntity();
            document.Classes = dto.classes?.Select(c => new Domain.Entities.Class { Id = c.Id }).ToList() ?? new List<Domain.Entities.Class>();

            var createdDocument = await _documentService.CreateDocumentAsync(
                document, dto.DocumentFile, dto.ThumbnailFile);

            return CreatedAtAction(nameof(GetDocumentById), new { id = createdDocument.Id },
                new { success = true, data = createdDocument.ToDetailDto() });
        }

        [HttpPut("{id:int}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateDocument(int id, [FromForm] UpdateDocumentDto dto)
        {
            if (id != dto.Id)
                return BadRequest(new { success = false });

            if (!ModelState.IsValid)
                return BadRequest(new { success = false, errors = ModelState });

            var document = dto.ToEntity();
            document.Classes = dto.classes?.Select(c => new Domain.Entities.Class { Id = c.Id }).ToList() ?? new List<Domain.Entities.Class>();

            var updatedDocument = await _documentService.UpdateDocumentAsync(
                document, dto.DocumentFile, dto.ThumbnailFile);

            return Ok(new { success = true, data = updatedDocument.ToDetailDto() });
        }

        [HttpDelete("{id:int}")]
        public IActionResult DeleteDocument(int id)
        {
            var result = _documentService.DeleteDocument(id);
            if (!result)
                return NotFound(new { success = false });

            return Ok(new { success = true });
        }

        [HttpPatch("soft-delete/{id:int}")]
        public IActionResult SoftDeleteDocument(int id, [FromBody] Guid deletedBy)
        {
            var result = _documentService.SoftDeleteDocument(id, deletedBy);
            if (!result)
                return NotFound(new { success = false });

            return Ok(new { success = true });
        }

        [HttpPost("approve")]
        public IActionResult ApproveDocument([FromBody] ApprovalDto dto)
        {
            var document = _documentService.ApproveDocument(dto.DocumentId, dto.ApprovedBy);
            return Ok(new { success = true, data = document.ToDetailDto() });
        }

        [HttpPost("reject")]
        public IActionResult RejectDocument([FromBody] ApprovalDto dto)
        {
            var document = _documentService.RejectDocument(dto.DocumentId, dto.ApprovedBy);
            return Ok(new { success = true, data = document.ToDetailDto() });
        }

        [HttpPost("revoke")]
        public IActionResult RevokeApproval([FromBody] ApprovalDto dto)
        {
            var document = _documentService.RevokeApproval(dto.DocumentId, dto.ApprovedBy);
            return Ok(new { success = true, data = document.ToDetailDto() });
        }

        [HttpPost("toggle-featured")]
        public IActionResult ToggleFeatured([FromBody] ToggleFeaturedDto dto)
        {
            var document = _documentService.ToggleFeatured(dto.DocumentId, dto.UpdatedBy);
            return Ok(new { success = true, data = document.ToDetailDto() });
        }

        [HttpGet("download/{id:int}")]
        public async Task<IActionResult> DownloadDocument(int id)
        {
            var document = _documentService.GetDocumentById(id);
            if (document == null)
                return NotFound(new { success = false });

            var (fileBytes, contentType, fileName) = await _documentService.DownloadDocumentAsync(document);
            return File(fileBytes, contentType, fileName);
        }

        [HttpGet("preview/{id:int}")]
        public async Task<IActionResult> PreviewDocument(int id)
        {
            var document = _documentService.GetDocumentById(id);
            if (document == null)
                return NotFound(new { success = false });

            var (fileBytes, contentType, _) = await _documentService.DownloadDocumentAsync(document);
            return File(fileBytes, contentType);
        }
    }
}