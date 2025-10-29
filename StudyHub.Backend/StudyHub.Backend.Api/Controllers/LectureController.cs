using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos.CourseDTOS;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LectureController : ControllerBase
    {
        private readonly LectureService _service;
        private readonly CloudFileStorageService _fileStorage;

        public LectureController(LectureService service, CloudFileStorageService fileStorage)
        {
            _service = service;
            _fileStorage = fileStorage;
        }

        // ==============================
        // ------- CHAPTER APIs ---------
        // ==============================

        [HttpGet("course/{courseId}/chapters")]
        public IActionResult GetChapters(int courseId)
        {
            var chapters = _service.GetChaptersForCourse(courseId);
            return Ok(chapters.Select(c => c.ToListDto()));
        }

        [HttpGet("chapter/{id}")]
        public IActionResult GetChapter(int id)
        {
            var ch = _service.GetChapter(id);
            if (ch == null) return NotFound();
            return Ok(ch.ToListDto());
        }

        [HttpPost("chapter")]
        public IActionResult CreateChapter([FromBody] ChapterDto ch)
        {
            if (ch == null) return BadRequest("Chapter data is required.");

            var entity = ch.ToEntity();
            var created = _service.CreateChapter(entity);

            return CreatedAtAction(nameof(GetChapter), new { id = created.Id }, created.ToListDto());
        }

        [HttpPut("chapter/{id}")]
        public IActionResult UpdateChapter(int id, [FromBody] ChapterDto ch)
        {
            if (ch == null) return BadRequest("Chapter data is required.");

            var existing = _service.GetChapter(id);
            if (existing == null) return NotFound();

            existing.Name = ch.Name;
            existing.CourseId = ch.CourseId;
            existing.Description = ch.Description;
            existing.PostDate = ch.PostDate;

            if (ch.Lessons != null && ch.Lessons.Any())
            {
                existing.Lessons = ch.Lessons.Select(l => l.ToEntity()).ToList();
            }

            var updated = _service.UpdateChapter(existing);
            return Ok(updated.ToListDto());
        }

        [HttpDelete("chapter/{id}")]
        public IActionResult DeleteChapter(int id)
        {
            var ok = _service.DeleteChapter(id);
            if (!ok) return NotFound();
            return NoContent();
        }

        // ==============================
        // -------- LESSON APIs ---------
        // ==============================

        [HttpGet("chapter/{chapterId}/lessons")]
        public IActionResult GetLessons(int chapterId)
        {
            var lessons = _service.GetLessonsForChapter(chapterId);
            return Ok(lessons.Select(l => l.ToListDto()));
        }

        [HttpGet("lesson/{id}")]
        public IActionResult GetLesson(int id)
        {
            var l = _service.GetLesson(id);
            if (l == null) return NotFound();
            return Ok(l.ToListDto());
        }

        [HttpPost("lesson")]
        public IActionResult CreateLesson([FromBody] LessonDto l)
        {
            if (l == null) return BadRequest("Lesson data is required.");

            var entity = l.ToEntity();
            var created = _service.CreateLesson(entity);

            return CreatedAtAction(nameof(GetLesson), new { id = created.Id }, created.ToListDto());
        }

        [HttpPut("lesson/{id}")]
        public IActionResult UpdateLesson(int id, [FromBody] LessonDto l)
        {
            if (l == null) return BadRequest("Lesson data is required.");

            var existing = _service.GetLesson(id);
            if (existing == null) return NotFound();

            existing.Name = l.Name;
            existing.Type = l.Type;
            existing.Duration = l.Duration;
            existing.Description = l.Description;
            existing.PostDate = l.PostDate;
            existing.IsPreview = l.IsPreview;
            existing.ResourceId = l.ResourceId;

            // Update LessonVideo
            if (!string.IsNullOrEmpty(l.VideoUrl))
            {
                if (existing.LessonVideo == null)
                    existing.LessonVideo = new LessonVideo();

                existing.LessonVideo.Url = l.VideoUrl;
            }
            else
            {
                existing.LessonVideo = null;
            }

            // Update LessonReading
            if (!string.IsNullOrEmpty(l.ReadingContent))
            {
                if (existing.LessonReading == null)
                    existing.LessonReading = new LessonReading();

                existing.LessonReading.Content = l.ReadingContent;
            }
            else
            {
                existing.LessonReading = null;
            }

            var updated = _service.UpdateLesson(existing);
            return Ok(updated.ToListDto());
        }

        [HttpDelete("lesson/{id}")]
        public IActionResult DeleteLesson(int id)
        {
            var ok = _service.DeleteLesson(id);
            if (!ok) return NotFound();
            return NoContent();
        }

        [HttpPost("upload-resource")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadThumbnail([FromForm] UploadResourceDto dto)
        {
            var file = dto.File;
            if (file == null || file.Length == 0)
                return BadRequest("File is required");

            try
            {
                var path = UseCases.Utils.FileConstants.CourseResourceUploadPath;
                var url = await _fileStorage.UploadDocumentAsync(file, path);
                if (string.IsNullOrEmpty(url))
                    return StatusCode(500, "Upload failed");

                return Ok(new { url });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}
