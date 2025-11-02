using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.ClassworkDTOS;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClassworkController : ControllerBase
    {
        private readonly ClassService _service;

        public ClassworkController(ClassService service)
        {
            _service = service;
        }

        [HttpGet("class/{classId}")]
        public IActionResult GetByClass(int classId)
        {
            var cw = _service.GetClassworks(classId);
            if (cw == null) return NotFound();
            return Ok(new { success = true, message = "Danh sách classworks.", classes = cw });
        }

        [HttpPost]
        public IActionResult Create([FromBody] CreateClassworkDto dto)
        {
            if (dto.ClassId <= 0 || string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { success = false, message = "Thiếu thông tin classId hoặc title" });
            var entity = dto.ToEntity();
            var cw = _service.CreateClasswork(entity);
            return CreatedAtAction(nameof(GetByClass), new { classId = cw.ClassId }, cw);
        }

        [HttpPut("{id}")]
        public IActionResult Edit(int id, [FromBody] EditClassworkDto dto)
        {
            var cw = _service.EditClassworkFromPrimitives(id, dto.Title, dto.Description, dto.Deadline);
            if (cw == null) return NotFound(new { success = false, message = "Không tìm thấy classwork" });
            return Ok(new { success = true, message = "Đã update", data = cw });
        }

        [HttpGet("{id}/detail")]
        public IActionResult GetDetail(int id)
        {
            var result = _service.GetClassworkDetail(id);
            if (result == null) return NotFound(new { success = false, message = "Không tìm thấy classwork" });
            return Ok(new { success = true, data = result.Value.Classwork, submissions = result.Value.Submissions });
        }

        [HttpPost("{id}/submit")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Submit(int id, [FromForm] SubmitClassworkDto dto)
        {
            try
            {
                var result = await _service.SubmitClassworkWithFilesAsync(id, dto.AppUserId, dto.Files?.ToList());
                if (result == null) return BadRequest(new { success = false, message = "Thiếu thông tin hoặc lỗi khi nộp bài" });

                return Ok(new
                {
                    success = true,
                    message = result.Value.IsResubmit ? "Đã nộp lại bài" : "Đã nộp bài mới",
                    submissionId = result.Value.SubmissionId,
                    files = result.Value.Files
                });
            }
            catch (ArgumentException aex)
            {
                return BadRequest(new { success = false, message = aex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi khi nộp bài: {ex.Message}", error = ex.ToString() });
            }
        }

        [HttpGet("submission")]
        public IActionResult GetSubmission(int classworkID, Guid userid)
        {
            var submitFile = _service.GetSubmissionByUserAndClasswork(classworkID, userid);
            if (submitFile == null) return NotFound(new { success = false, message = "Không tìm thấy classwork" });
            var fi = _service.GetSubmissionFiles(submitFile.Id);
            return Ok(new { success = true, data = submitFile.ToSubmissionDto(fi) });
        }

        [HttpGet("submissioncount/{classworkID}")]
        public IActionResult GetSubmissionCount(int classworkID)
        {
            var numberSubmission = _service.GetSubmissionCount(classworkID);
            return Ok(numberSubmission);
        }

        [HttpGet("membercount/{classworkID}")]
        public IActionResult GetMemberCount(int classworkID)
        {
            var numberMember = _service.GetMemberCount(classworkID);
            return Ok(numberMember);
        }

        [HttpGet("classmembercount/{classID}")]
        public IActionResult GetMemberClassCount(int classID)
        {
            var numberMember = _service.GetMemberClassCount(classID);
            return Ok(numberMember);
        }
    }
}
