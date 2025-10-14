using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Mappers;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GradeController : ControllerBase
    {
        private readonly GradeService _gradeservice;
        public GradeController(GradeService service)
        {
            _gradeservice = service;
        }
        [HttpGet("allgrade")]
        public IActionResult GetGrades()
        {
            var gradeService = _gradeservice.GetAllGrades();
            return Ok(gradeService.Select(g => g.ToListDto()));
        }
    }
}
