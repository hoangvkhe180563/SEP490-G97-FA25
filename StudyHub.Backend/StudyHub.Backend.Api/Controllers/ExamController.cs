using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.ExamDTOS;
using StudyHub.Backend.Api.Dtos.QuestionDTOS;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExamController : ControllerBase
    {
        private readonly ExamService _service;
        public ExamController(ExamService service)
        {
            _service = service;
        }

        [HttpGet("class/by-student/{studentId:guid}")]
        public IActionResult GetAllClassExamsByStudent(Guid studentId)
        {
            if (studentId == Guid.Empty)
            {
                return BadRequest();
            }
            return Ok(_service.GetAllClassExamsByStudent(studentId));
        }

        [HttpGet("class/by-teacher/{teacherId:guid}")]
        public IActionResult GetAllClassExamsByTeacher(Guid teacherId)
        {
            if (teacherId == Guid.Empty)
            {
                return BadRequest();
            }
            return Ok(_service.GetAllClassExamsByTeacher(teacherId));
        }

        [HttpGet("class/{classId:int}")]
        public IActionResult GetAllClassExamsByClassId(int classId)
        {
            if (classId == 0)
            {
                return BadRequest();
            }
            return Ok(_service.GetAllClassExams(classId));
        }

        [HttpGet("lesson/{lessonId:int}")]
        public IActionResult GetExamByLessonId(int lessonId)
        {
            if (lessonId == 0)
            {
                return BadRequest();
            }
            var lessonExam = _service.GetLessonExam(lessonId);
            if (lessonExam == null)
            {
                return NotFound();
            }
            return Ok(lessonExam.ToDetailsDto());
        }

        [HttpGet("className/{classId:int}")]
        public IActionResult GetClassNameById(int classId)
        {
            if (classId == 0)
            {
                return BadRequest();
            }
            return Ok(_service.GetClassName(classId));
        }

        [HttpGet("lessonName/{lessonId:int}")]
        public IActionResult GetLessonNameById(int lessonId)
        {
            if (lessonId == 0)
            {
                return BadRequest();
            }
            return Ok(_service.GetLessonName(lessonId));
        }

        [HttpGet("{examId:int}")]
        public IActionResult GetExamById(int examId, bool retrieveQuestions)
        {
            if (examId == 0)
            {
                return BadRequest();
            }

            var exam = _service.GetExamById(examId, retrieveQuestions);
            if (exam == null)
            {
                return NotFound();
            }
            return Ok(exam.ToDetailsDto());
        }


        [HttpGet("lesson/exists/{lessonId:int}")]
        public IActionResult IsLessonExamExists(int lessonId)
        {
            bool? result = _service.IsLessonExamExists(lessonId);
            if (result == null)
            {
                return NotFound();
            }
            return Ok(result);
        }

        [HttpPost]
        public IActionResult CreateExam(ExamCreateDto examDto)
        {
            if ((examDto.ClassId == null || examDto.ClassId == 0) && (examDto.LessonId == null || examDto.LessonId == 0))
            {
                return BadRequest("Phải có class id hoặc lesson id!");
            }
            List<string> questionTypes = ["single-choice", "multiple-choice", "text-input", "fill-blank", "matching"];
            if (!examDto.Questions.All(q => questionTypes.Contains(q.Type)))
            {
                return BadRequest("Các câu hỏi phải có 1 trong các định dạng: single-choice, multiple-choice, text-input, fill-blank, matching.");
            }

            if (!examDto.Questions.All(q => q.CorrectAnswer != null))
            {
                return BadRequest("Các câu hỏi phải có ít nhất 1 câu trả lời đúng!");
            }
            var examEntity = examDto.ToExamEntity();
            bool success = _service.CreateExam(examEntity);
            return success ? Ok() : Conflict();
        }

        [HttpPut]
        public IActionResult UpdateExam(ExamUpdateDto examDto)
        {
            if (examDto.Id == 0 || examDto.QuestionObjectIds.Any(q => q.Length != 24))
            {
                return BadRequest("Thiếu/Sai định dạng id của exam hoặc câu hỏi!");
            }

            var examEntity = examDto.ToExamEntity();
            bool isQuestionsUpdated = _service.UpdateExamQuestions(examEntity.Id, examDto.QuestionObjectIds);
            if (!isQuestionsUpdated)
            {
                return Conflict("Cập nhật câu hỏi thất bại!");
            }

            bool isExamUpdated = _service.UpdateExam(examEntity);
            return isExamUpdated ? Ok() : Conflict();
        }

        [HttpPut("{examId:int}/update-questions")]
        public IActionResult UpdateExamQuestions(int examId, [FromBody] List<QuestionUpdateDto> questions)
        {
            List<string> questionTypes = ["single-choice", "multiple-choice", "text-input", "fill-blank", "matching"];
            if (!questions.All(q => questionTypes.Contains(q.Type)))
            {
                return BadRequest("Các câu hỏi phải có 1 trong các định dạng: single-choice, multiple-choice, text-input, fill-blank, matching.");
            }

            if (!questions.All(q => q.CorrectAnswer != null))
            {
                return BadRequest("Các câu hỏi phải có ít nhất 1 câu trả lời đúng!");
            }
            List<Question> questionEntities = questions.Select(q => q.ToQuestionEntity()).ToList();
            List<string> questionObjectIds = _service.UpdateExamQuestions(examId, questionEntities);
            return Ok(questionObjectIds);
        }

        [HttpGet("return-lesson-course/{lessonId:int}")]
        public IActionResult GetCourseIdByLessonId(int lessonId)
        {
            var courseId = _service.GetCourseIdByLessonId(lessonId);
            return courseId == 0 ? NotFound() : Ok(courseId);
        }
    }
}
