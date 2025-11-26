using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ElasticAdminController : ControllerBase
    {
        private readonly ElasticCourseVectorSearchService _elasticCourseVectorSearchService;
        private readonly ElasticDocumentVectorSearchService _elasticDocumentVectorSearchService;

        public ElasticAdminController(ElasticCourseVectorSearchService elasticCourseVectorSearchService, ElasticDocumentVectorSearchService elasticDocumentVectorSearchService)
        {
            _elasticCourseVectorSearchService = elasticCourseVectorSearchService;
            _elasticDocumentVectorSearchService = elasticDocumentVectorSearchService;
        }

        [HttpPost("setup-course-index")]
        public async Task<IActionResult> SetupCourseIndex()
        {
            try
            {
                var result = await _elasticCourseVectorSearchService.CreateCourseIndexAsync();
                return Ok(new { success = result, message = "Index created successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("setup-document-index")]
        public async Task<IActionResult> SetupDocumentIndex()
        {
            try
            {
                var result = await _elasticDocumentVectorSearchService.CreateDocumentIndexAsync();
                return Ok(new { success = result, message = "Index created successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("index-course")]
        public async Task<IActionResult> AddCourse([FromBody] UpsertElasticCourseRequest course)
        {
            try
            {
                var result = await _elasticCourseVectorSearchService.IndexCourseAsync(course);
                return Ok(new { success = result, message = "Course added successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("index-document")]
        public async Task<IActionResult> AddDocument([FromBody] UpsertElasticDocumentRequest document)
        {
            try
            {
                var result = await _elasticDocumentVectorSearchService.IndexDocumentAsync(document);
                return Ok(new { success = result, message = "Document added successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("index-all-course-db")]
        public async Task<IActionResult> IndexAllCourseFromDb()
        {
            try
            {
                var result = await _elasticCourseVectorSearchService.IndexAllCoursesFromDbAsync();
                return Ok(new { success = result, message = result ? "All courses indexed successfully" : "Failed to index courses" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
        [HttpPost("index-all-document-db")]
        public async Task<IActionResult> IndexAllDocumentFromDb()
        {
            try
            {
                var result = await _elasticDocumentVectorSearchService.IndexAllDocumentsFromDbAsync();
                return Ok(new { success = result, message = result ? "All documents indexed successfully" : "Failed to index documents" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("index-course/{id}")]
        public async Task<IActionResult> DeleteCourseIndexById(int id)
        {
            try
            {
                var result = await _elasticCourseVectorSearchService.DeleteCourseByIdAsync(id);
                return Ok(new { success = result, message = result ? "Course deleted successfully" : "Failed to delete course" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("index-document/{id}")]
        public async Task<IActionResult> DeleteDocumentIndexById(int id)
        {
            try
            {
                var result = await _elasticDocumentVectorSearchService.DeleteDocumentByIdAsync(id);
                return Ok(new { success = result, message = result ? "Document deleted successfully" : "Failed to delete document" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("seed-courses")]
        public async Task<IActionResult> SeedCourses()
        {
            try
            {
                var courses = GenerateTestCourses();
                var result = await _elasticCourseVectorSearchService.IndexCoursesBatchAsync(courses);

                return Ok(new
                {
                    success = result,
                    message = $"{courses.Count} courses indexed successfully",
                    courses = courses.Select(c => new { c.Id, c.Name, c.Difficulty })
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("seed-llm-courses")]
        public async Task<IActionResult> SeedLLMCourses()
        {
            try
            {
                var result = await _elasticCourseVectorSearchService.SeedSampleCoursesAsync();
                return Ok(new
                {
                    success = result,
                    message = "20 sample courses seeded successfully for LLM testing"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message, stack = ex.StackTrace });
            }
        }
        [HttpPost("seed-documents")]
        public async Task<IActionResult> SeedDocuments()
        {
            try
            {
                var docs = GenerateTestDocuments();
                var result = await _elasticDocumentVectorSearchService.IndexDocumentsBatchAsync(docs);

                return Ok(new
                {
                    success = result,
                    message = $"{docs.Count} documents indexed successfully",
                    documents = docs.Select(d => new { d.Id, d.Name, d.Grade })
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("seed-llm-documents")]
        public async Task<IActionResult> SeedLLMDocuments()
        {
            try
            {
                var result = await _elasticDocumentVectorSearchService.SeedSampleDocumentsAsync();
                return Ok(new
                {
                    success = result,
                    message = "20 sample documents seeded successfully for LLM testing"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message, stack = ex.StackTrace });
            }
        }
        private List<Course> GenerateTestCourses()
        {
            var courses = new List<Course>();
            var subjects = new[] { "Toán học", "Hóa học", "Ngữ văn", "Vật lý" };
            var difficulties = new[]
            {
            CourseDifficulty.Beginner,
            CourseDifficulty.Intermediate,
            CourseDifficulty.Advanced
        };
            var lengths = new[] { CourseLength.Short, CourseLength.Medium, CourseLength.Long };

            int id = 1;

            foreach (var subject in subjects)
            {
                foreach (var difficulty in difficulties)
                {
                    // 2-3 khóa học cho mỗi môn ở mỗi độ khó
                    for (int i = 0; i < 2; i++)
                    {
                        var grade = difficulty switch
                        {
                            CourseDifficulty.Beginner => 10,
                            CourseDifficulty.Intermediate => 11,
                            CourseDifficulty.Advanced => 12,
                            _ => 10
                        };

                        var difficultyName = difficulty switch
                        {
                            CourseDifficulty.Beginner => "cơ bản",
                            CourseDifficulty.Intermediate => "trung bình",
                            CourseDifficulty.Advanced => "nâng cao",
                            _ => ""
                        };

                        courses.Add(new Course
                        {
                            Id = id++,
                            Name = $"{subject} lớp {grade} {difficultyName} - Phần {i + 1}",
                            Information = $"Khóa học {subject} dành cho học sinh lớp {grade}, " +
                                        $"độ khó {difficultyName}. Giúp học sinh nắm vững kiến thức " +
                                        $"và kỹ năng {subject}.",
                            SchoolId = 1,
                            Subject = new Domain.Entities.Subject { Name = subject },
                            Difficulty = difficulty,
                            Length = lengths[i % 3],
                            Grade = (sbyte)grade
                        });
                    }
                }
            }

            return courses;
        }

        private List<Document> GenerateTestDocuments()
        {
            var docs = new List<Document>();
            var subjects = new[] { "Toán học", "Hóa học", "Ngữ văn", "Vật lý" };
            var categories = new[] { "LectureNotes", "Exercise", "Exam", "Summary" };
            var difficulties = new[]
            {
                "Easy",
                "Medium",
                "Hard"
            };
            var lengths = new[]
            {
                "Short",
                "Medium",
                "Long"
            };
            int id = 1;

            foreach (var subject in subjects)
            {
                foreach (var difficulty in difficulties)
                {
                    // 2-3 khóa học cho mỗi môn ở mỗi độ khó
                    for (int i = 0; i < 2; i++)
                    {
                        var grade = (sbyte)(9 + (i % 4));
                        var category = categories[i % categories.Length];

                        var difficultyName = difficulty switch
                        {
                            "Easy" => "cơ bản",
                            "Medium" => "trung bình",
                            "Hard" => "nâng cao",
                            _ => ""
                        };

                        docs.Add(new Document
                        {
                            Id = id++,
                            Name = $"{subject} - Tài liệu {category} {i + 1}",
                            Description = $"{category} về {subject}, phù hợp cho lớp {grade}, độ khó {difficultyName}. Giúp học sinh nắm vững kiến thức và kỹ năng {subject}.",
                            DocumentUrl = $"https://example.com/{subject.ToLower().Replace(' ', '-')}/{category.ToLower()}/{i + 1}",
                            Thumbnail = null,
                            SchoolId = 1,
                            Subject = new Subject { Name = subject },
                            DocumentCategory = new DocumentCategory { Name = category },
                            Grade = grade,
                            IsInClass = false,
                            IsFeatured = false,
                            DocumentLengthType = lengths[i % 3],
                            DocumentLevel = difficulty
                        });
                    }
                }
            }

            return docs;
        }
    }
}
