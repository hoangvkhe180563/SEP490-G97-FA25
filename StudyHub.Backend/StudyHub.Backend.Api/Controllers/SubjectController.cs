using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Mappers;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubjectController : ControllerBase
    {
        private readonly SubjectService _subjectservice;
        public SubjectController(SubjectService service)
        {
            _subjectservice = service;
        }
        [HttpGet("allsubject")]
        public IActionResult GetSubjects()
        {
            var subjectService = _subjectservice.GetSubjects();
            return Ok(subjectService.Select(s => s.ToListDto()));
        }
    }
}
