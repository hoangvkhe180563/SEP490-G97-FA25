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

            // persist interactive questions if provided
            try
            {
                if (l.InteractiveQuestions != null && l.InteractiveQuestions.Any())
                {
                    var iq = l.InteractiveQuestions.Select(i => new StudyHub.Backend.Domain.Entities.InteractiveQuestion
                    {
                        TimeSec = i.TimeSec,
                        QuestionText = i.Question,
                        Type = i.Type,
                        OptionsJson = i.Options != null ? System.Text.Json.JsonSerializer.Serialize(i.Options) : null,
                        CorrectIndex = i.CorrectIndex,
                        CorrectAnswer = i.CorrectAnswer,
                        CreatedAt = DateTime.UtcNow
                    }).ToList();
                    _service.CreateInteractiveQuestions(created.Id, iq);
                }
            }
            catch
            {
                // non-fatal: continue
            }

            return CreatedAtAction(nameof(GetLesson), new { id = created.Id }, created.ToListDto());
        }

        [HttpPost("lesson/{lessonId}/interactive-response")]
        public IActionResult SubmitInteractiveResponse(int lessonId, [FromBody] object payload)
        {
            // payload is expected to contain questionId and answer shape { selectedIndex?, value? }
            try
            {
                if (payload == null) return BadRequest("payload required");
                var doc = System.Text.Json.JsonSerializer.SerializeToElement(payload);
                var questionId = doc.GetProperty("questionId").GetInt32();

                Guid userId = Guid.Empty;
                // if user is authenticated, use user id; fallback to empty guid
                if (HttpContext.User?.Identity?.IsAuthenticated == true)
                {
                    var claim = HttpContext.User.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type == "id" || c.Type.EndsWith("nameidentifier"));
                    if (claim != null) Guid.TryParse(claim.Value, out userId);
                }

                var resp = new StudyHub.Backend.Domain.Entities.InteractiveResponse
                {
                    LessonId = lessonId,
                    QuestionId = questionId,
                    AppUserId = userId,
                    CreatedAt = DateTime.UtcNow
                };

                if (doc.TryGetProperty("answer", out var ans))
                {
                    if (ans.ValueKind == System.Text.Json.JsonValueKind.Object)
                    {
                        if (ans.TryGetProperty("selectedIndex", out var si) && si.ValueKind == System.Text.Json.JsonValueKind.Number)
                        {
                            resp.SelectedIndex = si.GetInt32();
                        }
                        if (ans.TryGetProperty("value", out var val) && val.ValueKind == System.Text.Json.JsonValueKind.String)
                        {
                            resp.AnswerText = val.GetString();
                        }
                    }
                    else if (ans.ValueKind == System.Text.Json.JsonValueKind.String)
                    {
                        resp.AnswerText = ans.GetString();
                    }
                }

                // compute correctness if possible by looking up the question
                try
                {
                    var qs = _service.GetInteractiveQuestions(lessonId);
                    var q = qs?.FirstOrDefault(x => x.Id == questionId);
                    if (q != null)
                    {
                        bool? isCorrect = null;
                        if (q.Type == "mc")
                        {
                            if (resp.SelectedIndex.HasValue && q.CorrectIndex.HasValue)
                            {
                                isCorrect = resp.SelectedIndex.Value == q.CorrectIndex.Value;
                            }
                        }
                        else if (q.Type == "text")
                        {
                            if (!string.IsNullOrEmpty(q.CorrectAnswer))
                            {
                                var given = (resp.AnswerText ?? string.Empty).Trim().ToLowerInvariant();
                                var expect = q.CorrectAnswer.Trim().ToLowerInvariant();
                                isCorrect = given == expect;
                            }
                        }
                        resp.IsCorrect = isCorrect;
                    }
                }
                catch
                {
                    // ignore correctness computation failures
                }

                var createdResp = _service.CreateInteractiveResponse(resp);
                return Ok(new { success = true, data = createdResp, isCorrect = resp.IsCorrect });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
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
            // if interactive questions provided in DTO, replace existing questions for this lesson
            try
            {
                if (l.InteractiveQuestions != null && l.InteractiveQuestions.Any())
                {
                    var iq = l.InteractiveQuestions.Select(i => new StudyHub.Backend.Domain.Entities.InteractiveQuestion
                    {
                        TimeSec = i.TimeSec,
                        QuestionText = i.Question,
                        Type = i.Type,
                        OptionsJson = i.Options != null ? System.Text.Json.JsonSerializer.Serialize(i.Options) : null,
                        CorrectIndex = i.CorrectIndex,
                        CorrectAnswer = i.CorrectAnswer,
                        CreatedAt = DateTime.UtcNow
                    }).ToList();
                    _service.ReplaceInteractiveQuestions(updated.Id, iq);
                }
            }
            catch
            {
                // non-fatal
            }

            return Ok(updated.ToListDto());
        }

        [HttpGet("lesson/{lessonId}/interactive-questions")]
        public IActionResult GetInteractiveQuestions(int lessonId)
        {
            try
            {
                var list = _service.GetInteractiveQuestions(lessonId);
                if (list == null) return NotFound();
                return Ok(list.Select(q => q.ToDto()));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
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
