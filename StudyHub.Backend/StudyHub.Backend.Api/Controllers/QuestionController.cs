using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.QuestionDTOS;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class QuestionController : ControllerBase
    {
        private readonly QuestionService _questionService;
        public QuestionController(QuestionService questionService)
        {
            _questionService = questionService;
        }

        [HttpGet]
        public IActionResult GetCommonQuestions([FromQuery] CommonQuestionGetDto dto)
        {
            if (dto.SubjectId == 0 || dto.Grade == 0)
            {
                return BadRequest("Câu hỏi phải có id môn học và lớp!");
            }
            if (dto.Page == 0 || dto.PageSize == 0)
            {
                return BadRequest("Phải có số trang!");
            }
            var result = _questionService.GetCommonQuestions(dto.SubjectId, dto.Grade, dto.Page, dto.PageSize);
            return Ok(result);
        }

        [HttpPost("common")]
        public IActionResult AddCommonQuestions(List<QuestionCreateDto> questions)
        {
            foreach (QuestionCreateDto question in questions)
            {
                if (question.Grade == null || question.SubjectId == null)
                {
                    return BadRequest("Câu hỏi phải có id môn học và lớp!");
                }
            }

            var questionEntities = questions.Select(q => q.ToQuestionEntity()).ToList();

            var result = _questionService.AddCommonQuestions(questionEntities);
            return result.Count == 0 ? Conflict("Không thêm được câu hỏi!") : Ok(result);
        }

        [HttpPut("common")]
        public IActionResult UpdateCommonQuestion(QuestionUpdateDto question)
        {
            if (question.Grade == null || question.SubjectId == null)
            {
                return BadRequest("Câu hỏi phải có id môn học và lớp!");
            }

            var questionEntity = question.ToQuestionEntity();

            var result = _questionService.UpdateCommonQuestion(questionEntity);
            return result ? Ok() : Conflict("Không cập nhật được câu hỏi!");
        }

        [HttpDelete]
        public IActionResult DeleteCommonQuestion(string questionObjectId)
        {
            if (questionObjectId == string.Empty)
            {
                return BadRequest("Phải có id câu hỏi!");
            }
            var result = _questionService.DeleteCommonQuestion(questionObjectId);
            return result ? Ok() : Conflict("Không xóa được câu hỏi!");
        }
    }
}
