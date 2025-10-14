using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.UseCases.Services;

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
        

        [HttpGet("getbyid/{id:int}")]
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

        [HttpPost("search")]
        public IActionResult SearchDocuments([FromBody] DocumentFilterDto filter)
        {
            try
            {
                var (documents, totalCount) = _documentService.SearchDocuments(
                    filter.Query,
                    filter.CategoryId,
                    filter.GradeId,
                    filter.SchoolId,
                    filter.Subject,
                    filter.UploaderId,
                    filter.Accessibility,
                    filter.IsFeatured,
                    filter.IsPendingApproval,
                    filter.IncludeUnapproved,
                    filter.PageNumber,
                    filter.PageSize
                );

                var dtos = documents.Select(d => d.ToListDto()).ToList();
                return Ok(new
                {
                    success = true,
                    data = dtos,
                    pagination = new
                    {
                        currentPage = filter.PageNumber,
                        pageSize = filter.PageSize,
                        totalCount,
                        totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to search documents", error = ex.Message });
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

        [HttpPut("edit/{id:int}")]
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

        [HttpDelete("delete/{id:int}")]
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