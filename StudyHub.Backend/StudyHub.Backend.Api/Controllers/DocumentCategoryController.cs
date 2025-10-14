using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Mappers;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DocumentCategoryController : ControllerBase
    {
        private readonly DocumentCategoryService _documentcategoryservice;
        public DocumentCategoryController(DocumentCategoryService service)
        {
            _documentcategoryservice = service;
        }
        [HttpGet("alldoccate")]
        public IActionResult GetDocumentCategories()
        {
            var documentcategoryService = _documentcategoryservice.GetDocumentCategories();
            return Ok(documentcategoryService.Select(dc => dc.ToListDto()));
        }
    }
}
