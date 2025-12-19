using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
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
        public IActionResult GetGeneralLandingPage()
        {
            var landingPage = _service.GetGeneralLandingPage();
            var landingPageDto = landingPage.ToLandingPageDisplay();
            return Ok(landingPageDto);
        }

        [HttpGet("{id:int}")]
        public IActionResult GetLandingPage(int id)
        {
            var landingPage = _service.GetSchoolLandingPage(id);
            if (landingPage == null)
            {
                return NotFound();
            }

            var landingPageDto = landingPage.ToLandingPageDisplay();
            return Ok(landingPageDto);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateLandingPage([FromForm] LandingPageUpdateDto landingPageDto)
        {
            if (landingPageDto.SchoolId <= 0)
            {
                return NotFound();
            }
            var landingPage = landingPageDto.ToLandingPage();
            string msg = await _service.UpdateLandingPage(landingPage, landingPageDto.BannerFile, landingPageDto.SchoolLogoFile, landingPageDto.LandingPageDeleteImages, landingPageDto.LandingPageNewImages);

            return msg == string.Empty ? Ok("Cập nhật thành công!") : BadRequest(msg);
        }

        [HttpGet("{schoolId:int}/address")]
        public IActionResult GetSchoolAddress(int schoolId)
        {
            string address = _service.GetSchoolAddress(schoolId);
            return address == string.Empty ? NotFound() : Ok(address);
        }

        [HttpGet("schools")]
        public IActionResult GetSchools()
        {
            var list = _service.GetSchoolList();
            return list.Count == 0 ? NotFound() : Ok(list);
        }

        [HttpGet("schools/{id:int}")]
        public IActionResult GetSchoolById(int id)
        {
            var school = _service.GetSchoolById(id);
            return school == null ? NotFound() : Ok(school);
        }

        [HttpPost("schools/add")]
        public async Task<IActionResult> AddSchool([FromForm] SchoolCreateDto schoolDto)
        {
            bool success = await _service.AddSchool(schoolDto);
            return success ? Ok(schoolDto) : Conflict("Có lỗi xảy ra!");
        }

        [HttpPut("schools/update")]
        public async Task<IActionResult> UpdateSchool([FromForm] SchoolUpdateDto schoolDto)
        {
            bool success = await _service.UpdateSchool(schoolDto);
            return success ? Ok(schoolDto) : Conflict("Có lỗi xảy ra!");
        }

        [HttpGet("documents/{schoolId:int}")]
        public IActionResult GetAllDocumentsBySchool(int schoolId)
        {
            List<Document> documents = _service.GetAllDocumentsBySchool(schoolId);
            return Ok(documents.Select(d => new
            {
                d.Id,
                d.Name,
                Subject = d.Subject?.Name ?? "",
                d.Grade,
                d.IsFeatured
            }));
        }
    }
}
