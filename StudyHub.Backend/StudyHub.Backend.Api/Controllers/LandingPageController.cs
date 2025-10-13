using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LandingPageController : ControllerBase
    {
        private readonly LandingPageService _service;
        public LandingPageController(LandingPageService service)
        {
            _service = service;
        }

        [HttpGet]
        public IActionResult GetLandingPage([FromQuery] int id)
        {
            var landingPage = _service.GetLandingPageBySchool(id);
            if (landingPage == null)
            {
                return NotFound();
            }
            return Ok(landingPage);
        }
    }
}
