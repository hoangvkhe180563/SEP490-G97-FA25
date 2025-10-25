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

        [HttpGet("{id:int}")]
        public IActionResult GetLandingPage(int id)
        {
            var landingPage = _service.GetLandingPage(id);
            if (landingPage == null)
            {
                return NotFound();
            }

            var landingPageDto = new LandingPageDisplayDto
            {
                BannerUrl = landingPage.BannerUrl,
                Description = landingPage.Description,
                LandingPageImages = landingPage.LandingPageImages,
                FeaturedTeachers = landingPage.FeaturedTeachers.Select(ft => new LandingPageTeacherDisplayDto
                {
                    Name = ft.Fullname ?? "",
                    ImageUrl = ft.Avatar ?? ""
                }).ToList(),
                FeaturedDocuments = landingPage.FeaturedDocuments.Select(fd => new LandingPageDocumentDisplayDto
                {
                    Id = fd.Id,
                    Name = fd.Name,
                    Grade = fd.Grade,
                    SubjectName = fd.Subject.Name,
                    Thumbnail = fd.Thumbnail,
                    DocumentCategory = fd.DocumentCategoryId
                }).ToList(),
                FeaturedCourses = landingPage.FeaturedCourses.Select(fc => new LandingPageCourseDisplayDto
                {
                    Id = fc.Id,
                    Name = fc.Name,
                    Grade = fc.Grade,
                    SubjectName = fc.Subject.Name,
                    Thumbnail = fc.ImageUrl
                }).ToList()
            };
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
            string msg = await _service.UpdateLandingPage(landingPage, landingPageDto.BannerFile, landingPageDto.LandingPageDeleteImages, landingPageDto.LandingPageNewImages);

            return msg == string.Empty ? Ok("Cập nhật thành công!") : BadRequest(msg);
        }
    }
}
