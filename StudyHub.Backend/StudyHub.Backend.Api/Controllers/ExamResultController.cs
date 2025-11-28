using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.ExamDTOS;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExamResultController : ControllerBase
    {
        private readonly ExamService _service;
        public ExamResultController(ExamService service)
        {
            _service = service;
        }

        [HttpGet("by-exam/{examId:int}")]
        public IActionResult GetExamResultByExamId(int examId)
        {
            if (examId == 0)
            {
                return BadRequest();
            }

            var examResults = _service.GetExamResultsByExamId(examId);
            return Ok(examResults);
        }

        [HttpGet("{resultId}")]
        public IActionResult GetExamResultById(string resultId, bool isTeacher)
        {
            if (resultId == string.Empty || resultId.Length != 24)
            {
                return BadRequest("Truyền sai id");
            }

            var examResult = _service.GetExamResultById(resultId, isTeacher);
            if (examResult == null)
            {
                return NotFound();
            }
            return Ok(examResult);
        }

        [HttpGet("by-exam/{examId:int}/{studentId:guid}")]
        public IActionResult GetResultsByExamIdAndStudentId(int examId, Guid studentId)
        {
            if (studentId == Guid.Empty || examId == 0)
            {
                return BadRequest("Không có id học sinh hoặc id bài kiểm tra");
            }

            List<ExamResult> results = _service.GetResultsByExamIdAndStudentId(examId, studentId);
            return Ok(results);
        }

        [HttpPost]
        public IActionResult CreateExamResult([FromBody] ExamResultCreateDto resultDto)
        {
            if (resultDto.ExamId <= 0)
            {
                return BadRequest("Id của bài kiểm tra không đúng định dạng!");
            }
            var answers = resultDto.Answers;
            string resultObjectId = _service.CreateExamPaper(answers);
            if (resultObjectId == string.Empty)
            {
                return Conflict("Không thêm được bài làm, vui lòng thử lại!");
            }

            var result = new ExamResult
            {
                Id = resultObjectId,
                ExamId = resultDto.ExamId,
                FinishTime = resultDto.FinishTime,
                StudentId = resultDto.StudentId,
                Answers = answers
            };

            bool success = _service.CreateExamResult(result);

            return success ? Ok(resultObjectId) : Conflict();
        }

        [HttpPut]
        public IActionResult UpdateExamResult([FromBody] ExamResultUpdateDto resultDto)
        {
            if (resultDto.Id == string.Empty)
            {
                return BadRequest("Id của bài làm không đúng định dạng!");
            }
            var answers = resultDto.Answers;
            bool hasAnswersUpdated = _service.UpdateExamPaper(resultDto.Id, answers);
            if (!hasAnswersUpdated)
            {
                return Conflict("Không cập nhật được bài làm, vui lòng thử lại!");
            }

            var result = new ExamResult
            {
                Id = resultDto.Id,
                CheatTimes = resultDto.CheatTimes,
                Answers = answers
            };

            bool success = _service.UpdateExamResult(result);
            return success ? Ok() : Conflict();
        }

        [HttpPut("{resultId}/submit")]
        public IActionResult SubmitExamResult(string resultId)
        {
            if (resultId == string.Empty)
            {
                return BadRequest("Không có id bài làm!");
            }
            bool? isAlreadySubmitted = _service.CheckIfResultIsSubmitted(resultId);
            if (isAlreadySubmitted == null)
            {
                return BadRequest("Không kiểm tra được trạng thái bài làm!");
            }
            else if (isAlreadySubmitted.Value == true)
            {
                return BadRequest("Bài làm đã được nộp!");
            }
            bool result = _service.SubmitExamResult(resultId);
            return result ? Ok("Nộp bài thành công!") : Conflict("Nộp bài thất bại!");
        }
    }
}
