using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Mappers;
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

        [HttpGet("list")]
        public IActionResult GetLandingPageList()
        {
            var landingPages = _service.GetLandingPageList();
            if (landingPages.Count == 0)
            {
                return NotFound("Không có danh sách trang chủ!");
            }
            else
            {
                return Ok(landingPages.Select(lp => lp.ToLandingPageListItem()).ToList());
            }
        }

        [HttpGet("{schoolId:int}/address")]
        public IActionResult GetSchoolAddress(int schoolId)
        {
            string address = _service.GetSchoolAddress(schoolId);
            return address == string.Empty ? NotFound() : Ok(address);
        }
    }
}
