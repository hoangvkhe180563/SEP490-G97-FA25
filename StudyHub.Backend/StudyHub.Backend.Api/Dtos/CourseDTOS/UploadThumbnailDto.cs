using Microsoft.AspNetCore.Mvc;

namespace StudyHub.Backend.Api.Dtos.CourseDTOS
{
    public class UploadThumbnailDto
    {
        [FromForm(Name = "file")]
        public IFormFile File { get; set; }
    }

    public class UploadResourceDto
    {
        [FromForm(Name = "file")]
        public IFormFile File { get; set; }
    }

}
