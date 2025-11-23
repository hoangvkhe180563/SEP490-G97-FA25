using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.QuestionDTOS;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.UseCases.Dtos;
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
            if (dto.SubjectId < 0)
            {
                return BadRequest("Id môn học không hợp lệ!");
            }
            if (dto.Grade < 0)
            {
                return BadRequest("Id môn học không hợp lệ!");
            }
            if (dto.Page <= 0)
            {
                return BadRequest("Số trang không hợp lệ!");
            }
            var result = _questionService.GetCommonQuestions(dto.SubjectId, dto.Grade, dto.Page, dto.Type, dto.QuestionText);
            int totalQuestions = _questionService.GetTotalQuestions(dto.SubjectId, dto.Grade, dto.Type, dto.QuestionText);
            int pageSize = 10;

            var response = new CommonQuestionResponseDto
            {
                Questions = result.Select(q => q.ToDetailDto()).ToList(),
                Page = dto.Page,
                TotalPages = (int)Math.Ceiling((double)totalQuestions / pageSize),
                TotalQuestions = totalQuestions
            };
            return Ok(response);
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

        [HttpDelete("{questionObjectId}")]
        public IActionResult DeleteCommonQuestion(string questionObjectId)
        {
            if (string.IsNullOrWhiteSpace(questionObjectId))
            {
                return BadRequest("Phải có id câu hỏi!");
            }
            var result = _questionService.DeleteCommonQuestion(questionObjectId);
            return result ? Ok() : Conflict("Không xóa được câu hỏi!");
        }

        [HttpGet("{managerId:guid}/subjects")]
        public IActionResult GetManagerSubjects(Guid managerId)
        {
            var subjects = _questionService.GetManagerSubjects(managerId);
            return Ok(subjects);
        }

        [HttpGet("{id}/details")]
        public IActionResult GetQuestionDetail(string id)
        {
            if (string.IsNullOrWhiteSpace(id) || id.Length < 24)
            {
                return BadRequest("Phải có id câu hỏi, hoặc id không đúng định dạng!");
            }
            var question = _questionService.GetQuestionById(id);
            return question != null ? Ok(question) : NotFound();
        }

        [HttpPost("excel")]
        public IActionResult ImportExcelQuestions(IFormFile excelFile)
        {
            if (excelFile == null || excelFile.Length == 0)
            {
                return BadRequest("Không có file excel!");
            }
            QuestionExcelDto questions = _questionService.ImportQuestionsFromExcel(excelFile);
            return questions.ErrorMessages.Count > 0 ? BadRequest(questions.ErrorMessages) : Ok(questions.Questions.Select(q => q.ToDetailDto()).ToList());
        }
    }
}
