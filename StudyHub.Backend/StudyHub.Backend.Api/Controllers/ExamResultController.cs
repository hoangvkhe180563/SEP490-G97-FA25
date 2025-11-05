using Microsoft.AspNetCore.Mvc;
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
        public IActionResult GetAllExamResultsByExamId(int examId)
        {
            Console.WriteLine("Getting questions...");
            return Ok(_service.GetAllQuestions());
        }

        [HttpGet("class/by-student/{studentId:guid}")]
        public IActionResult GetAllExamResultsByStudentId(Guid studentId)
        {
            Console.WriteLine("Getting questions...");
            return Ok(_service.GetAllQuestions());
        }

        [HttpGet("class/by-teacher/{teacherId:guid}")]
        public IActionResult GetAllExamResultsByTeacherId(Guid teacherId)
        {
            Console.WriteLine("Getting questions...");
            return Ok(_service.GetAllQuestions());
        }

        [HttpGet("{resultId:int}")]
        public IActionResult GetResultDetail(int resultId)
        {
            Console.WriteLine("Getting questions...");
            return Ok(_service.GetAllQuestions());
        }

        [HttpPost]
        public IActionResult CreateExamResult()
        {
            Console.WriteLine("Getting questions...");
            return Ok(_service.GetAllQuestions());
        }

        [HttpPut]
        public IActionResult BackupExamResult()
        {
            Console.WriteLine("Getting questions...");
            return Ok(_service.GetAllQuestions());
        }
    }
}
