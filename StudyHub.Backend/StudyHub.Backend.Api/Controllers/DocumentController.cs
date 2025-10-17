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
            try
            {
                var (documents, totalCount) = _documentService.GetPublicDocuments(
                    query, categoryId, grade, subject, classId, pageNumber, pageSize);

                var dtos = documents.Select(d => d.ToListDto()).ToList();

                var result = new StudyHub.Backend.UseCases.Dtos.PagedResult<DocumentListDto>
                {
                    Items = dtos,
                    Total = totalCount,
                    Page = pageNumber,
                    Limit = pageSize,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                };

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to retrieve public documents", error = ex.Message });
            }
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
            try
            {
                var (documents, totalCount) = _documentService.GetSchoolDocuments(
                    schoolId, query, categoryId, grade, subject, classId, pageNumber, pageSize);

                var dtos = documents.Select(d => d.ToListDto()).ToList();

                var result = new StudyHub.Backend.UseCases.Dtos.PagedResult<DocumentListDto>
                {
                    Items = dtos,
                    Total = totalCount,
                    Page = pageNumber,
                    Limit = pageSize,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                };

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to retrieve school documents", error = ex.Message });
            }
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
            try
            {
                var (documents, totalCount) = _documentService.GetOwnedDocuments(
                    creatorId, query, categoryId, grade, subject, classId, pageNumber, pageSize);

                var dtos = documents.Select(d => d.ToListDto()).ToList();

                var result = new StudyHub.Backend.UseCases.Dtos.PagedResult<DocumentListDto>
                {
                    Items = dtos,
                    Total = totalCount,
                    Page = pageNumber,
                    Limit = pageSize,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                };

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to retrieve owned documents", error = ex.Message });
            }
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
            try
            {
                var (documents, totalCount) = _documentService.GetManagerPublicDocuments(
                    query, categoryId, grade, subject, classId, isApproved, status, pageNumber, pageSize);

                var dtos = documents.Select(d => d.ToListDto()).ToList();

                var result = new StudyHub.Backend.UseCases.Dtos.PagedResult<DocumentListDto>
                {
                    Items = dtos,
                    Total = totalCount,
                    Page = pageNumber,
                    Limit = pageSize,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                };

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to retrieve manager public documents", error = ex.Message });
            }
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
            try
            {
                var (documents, totalCount) = _documentService.GetManagerSchoolDocuments(
                    schoolId, query, categoryId, grade, subject, classId, isApproved, status, pageNumber, pageSize);

                var dtos = documents.Select(d => d.ToListDto()).ToList();

                var result = new StudyHub.Backend.UseCases.Dtos.PagedResult<DocumentListDto>
                {
                    Items = dtos,
                    Total = totalCount,
                    Page = pageNumber,
                    Limit = pageSize,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                };

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to retrieve manager school documents", error = ex.Message });
            }
        }

        [HttpGet("{id:int}")]
        public IActionResult GetDocumentById(int id)
        {
            try
            {
                var document = _documentService.GetDocumentById(id);
                if (document == null)
                    return NotFound(new { success = false, message = $"Document with ID {id} not found" });

                return Ok(new { success = true, data = document.ToDetailDto() });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to retrieve document", error = ex.Message });
            }
        }

        [HttpPost("create")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateDocument([FromForm] CreateDocumentDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Invalid data", errors = ModelState });

                var document = dto.ToEntity();
                document.Classes = dto.classes?.Select(c => new Domain.Entities.Class { Id = c.Id }).ToList() ?? new List<Domain.Entities.Class>();

                var createdDocument = await _documentService.CreateDocumentAsync(
                    document, dto.DocumentFile, dto.ThumbnailFile);

                return CreatedAtAction(
                    nameof(GetDocumentById),
                    new { id = createdDocument.Id },
                    new { success = true, data = createdDocument.ToDetailDto() });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to create document", error = ex.Message });
            }
        }

        [HttpPut("{id:int}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateDocument(int id, [FromForm] UpdateDocumentDto dto)
        {
            try
            {
                if (id != dto.Id)
                    return BadRequest(new { success = false, message = "ID mismatch" });

                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Invalid data", errors = ModelState });

                var document = dto.ToEntity();
                document.Classes = dto.classes?.Select(c => new Domain.Entities.Class { Id = c.Id }).ToList() ?? new List<Domain.Entities.Class>();

                var updatedDocument = await _documentService.UpdateDocumentAsync(
                    document, dto.DocumentFile, dto.ThumbnailFile);

                return Ok(new { success = true, data = updatedDocument.ToDetailDto() });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to update document", error = ex.Message });
            }
        }

        [HttpDelete("{id:int}")]
        public IActionResult DeleteDocument(int id)
        {
            try
            {
                var result = _documentService.DeleteDocument(id);
                if (!result)
                    return NotFound(new { success = false, message = $"Document with ID {id} not found" });

                return Ok(new { success = true, message = "Document deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to delete document", error = ex.Message });
            }
        }

        [HttpPatch("soft-delete/{id:int}")]
        public IActionResult SoftDeleteDocument(int id, [FromBody] Guid deletedBy)
        {
            try
            {
                var result = _documentService.SoftDeleteDocument(id, deletedBy);
                if (!result)
                    return NotFound(new { success = false, message = $"Document with ID {id} not found" });

                return Ok(new { success = true, message = "Document soft deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to soft delete document", error = ex.Message });
            }
        }

        [HttpPost("approve")]
        public IActionResult ApproveDocument([FromBody] ApprovalDto dto)
        {
            try
            {
                var document = _documentService.ApproveDocument(dto.DocumentId, dto.ApprovedBy);
                return Ok(new { success = true, message = "Document approved successfully", data = document.ToDetailDto() });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to approve document", error = ex.Message });
            }
        }

        [HttpPost("reject")]
        public IActionResult RejectDocument([FromBody] ApprovalDto dto)
        {
            try
            {
                var document = _documentService.RejectDocument(dto.DocumentId, dto.ApprovedBy);
                return Ok(new { success = true, message = "Document rejected successfully", data = document.ToDetailDto() });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to reject document", error = ex.Message });
            }
        }

        [HttpPost("revoke")]
        public IActionResult RevokeApproval([FromBody] ApprovalDto dto)
        {
            try
            {
                var document = _documentService.RevokeApproval(dto.DocumentId, dto.ApprovedBy);
                return Ok(new { success = true, message = "Document approval revoked successfully", data = document.ToDetailDto() });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to revoke approval", error = ex.Message });
            }
        }

        [HttpPost("toggle-featured")]
        public IActionResult ToggleFeatured([FromBody] ToggleFeaturedDto dto)
        {
            try
            {
                var document = _documentService.ToggleFeatured(dto.DocumentId, dto.UpdatedBy);
                return Ok(new { success = true, message = "Featured status toggled successfully", data = document.ToDetailDto() });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to toggle featured", error = ex.Message });
            }
        }

        [HttpGet("download/{id:int}")]
        public async Task<IActionResult> DownloadDocument(int id)
        {
            try
            {
                var document = _documentService.GetDocumentById(id);
                if (document == null)
                    return NotFound(new { success = false, message = $"Document with ID {id} not found" });

                var (fileBytes, contentType, fileName) = await _documentService.DownloadDocumentAsync(document);
                return File(fileBytes, contentType, fileName);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to download document", error = ex.Message });
            }
        }

        [HttpGet("preview/{id:int}")]
        public async Task<IActionResult> PreviewDocument(int id)
        {
            try
            {
                var document = _documentService.GetDocumentById(id);
                if (document == null)
                    return NotFound(new { success = false, message = $"Document with ID {id} not found" });

                var (fileBytes, contentType, _) = await _documentService.DownloadDocumentAsync(document);
                return File(fileBytes, contentType);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to preview document", error = ex.Message });
            }
        }
    }
}