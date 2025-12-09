using Microsoft.AspNetCore.Http;
using Moq;
using OfficeOpenXml;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.UseCases.Repositories.Exam;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases.Tests.Services
{
    public class QuestionServiceTests
    {
        private readonly Mock<IQuestionRepository> _mockQuestionRepo;
        private readonly Mock<IQuestionManagerRepository> _mockManagerRepo;
        private readonly QuestionService _service;

        public QuestionServiceTests()
        {
            _mockQuestionRepo = new Mock<IQuestionRepository>();
            _mockManagerRepo = new Mock<IQuestionManagerRepository>();
            _service = new QuestionService(_mockQuestionRepo.Object, _mockManagerRepo.Object);
            ExcelPackage.License.SetNonCommercialPersonal("StudyHub");
        }

        #region AddCommonQuestions

        [Fact]
        public void AddCommonQuestions_ShouldReturnEmptyList_WhenInputListIsEmpty()
        {
            // Arrange
            var questions = new List<Question>();

            // Act
            var result = _service.AddCommonQuestions(questions);

            // Assert
            Assert.Empty(result);
            _mockQuestionRepo.Verify(x => x.AddManyQuestions(It.IsAny<List<Question>>()), Times.Never);
        }

        [Fact]
        public void AddCommonQuestions_ShouldCallRepoAndReturnIds_WhenInputListIsNotEmpty()
        {
            // Arrange
            var questions = new List<Question>
            {
                new SingleChoiceQuestion
                {
                    QuestionText = "Q1",
                    Type = QuestionType.SingleChoice,
                    Options = new List<string>(),
                    CorrectAnswer = 0
                }
            };
            var expectedIds = new List<string> { "60d5ecb8b5c9c62c9c27e311" };

            _mockQuestionRepo.Setup(x => x.AddManyQuestions(questions)).Returns(expectedIds);

            // Act
            var result = _service.AddCommonQuestions(questions);

            // Assert
            Assert.Equal(expectedIds, result);
            _mockQuestionRepo.Verify(x => x.AddManyQuestions(questions), Times.Once);
        }

        #endregion

        #region DeleteCommonQuestion

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("shortId")]
        public void DeleteCommonQuestion_ShouldReturnFalse_WhenIdIsInvalid(string invalidId)
        {
            // Act
            var result = _service.DeleteCommonQuestion(invalidId);

            // Assert
            Assert.False(result);
            _mockQuestionRepo.Verify(x => x.DeleteOneQuestion(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public void DeleteCommonQuestion_ShouldCallDelete_EvenIfQuestionNotFound()
        {
            // Arrange
            string validId = "60d5ecb8b5c9c62c9c27e311"; // 24 chars

            _mockQuestionRepo.Setup(x => x.GetQuestionById(validId)).Returns((Question?)null);
            _mockQuestionRepo.Setup(x => x.DeleteOneQuestion(validId)).Returns(false);

            // Act
            var result = _service.DeleteCommonQuestion(validId);

            // Assert
            Assert.False(result);
            _mockQuestionRepo.Verify(x => x.GetQuestionById(validId), Times.Once);
            _mockQuestionRepo.Verify(x => x.DeleteOneQuestion(validId), Times.Once);
        }

        [Fact]
        public void DeleteCommonQuestion_ShouldReturnTrue_WhenDeleteIsSuccessful()
        {
            // Arrange
            string validId = "60d5ecb8b5c9c62c9c27e311";
            var question = new TextInputQuestion
            {
                Id = validId,
                QuestionText = "Text",
                Type = QuestionType.TextInput,
                CorrectAnswer = "A"
            };

            _mockQuestionRepo.Setup(x => x.GetQuestionById(validId)).Returns(question);
            _mockQuestionRepo.Setup(x => x.DeleteOneQuestion(validId)).Returns(true);

            // Act
            var result = _service.DeleteCommonQuestion(validId);

            // Assert
            Assert.True(result);
            _mockQuestionRepo.Verify(x => x.DeleteOneQuestion(validId), Times.Once);
        }

        #endregion

        #region GetCommonQuestions

        [Fact]
        public void GetCommonQuestions_ShouldReturnListFromRepo()
        {
            // Arrange
            int subjectId = 1;
            int grade = 10;
            int page = 1;
            int type = 1;
            string text = "math";

            var expectedQuestions = new List<Question>
            {
                new SingleChoiceQuestion
                {
                    QuestionText = "Q1",
                    Type = QuestionType.SingleChoice,
                    Options = new List<string>(),
                    CorrectAnswer = 0
                }
            };

            _mockQuestionRepo
                .Setup(x => x.GetCommonQuestions(subjectId, grade, page, type, text))
                .Returns(expectedQuestions);

            // Act
            var result = _service.GetCommonQuestions(subjectId, grade, page, type, text);

            // Assert
            Assert.Same(expectedQuestions, result);
            Assert.Single(result);
        }

        #endregion

        #region UpdateCommonQuestion

        [Fact]
        public void UpdateCommonQuestion_ShouldCallRepoAndReturnResult()
        {
            // Arrange
            var question = new FillBlankQuestion
            {
                Id = "60d5ecb8b5c9c62c9c27e311",
                QuestionText = "Fill",
                Type = QuestionType.FillBlank,
                CorrectAnswer = new List<string> { "Answer" }
            };

            _mockQuestionRepo.Setup(x => x.UpdateOneQuestion(question)).Returns(true);

            // Act
            var result = _service.UpdateCommonQuestion(question);

            // Assert
            Assert.True(result);
            _mockQuestionRepo.Verify(x => x.UpdateOneQuestion(question), Times.Once);
        }

        #endregion

        #region GetManagerSubjects

        [Fact]
        public void GetManagerSubjects_ShouldReturnEmpty_WhenGuidIsEmpty()
        {
            // Act
            var result = _service.GetManagerSubjects(Guid.Empty);

            // Assert
            Assert.Empty(result);
            _mockManagerRepo.Verify(x => x.GetSubjectsByManagerId(It.IsAny<Guid>()), Times.Never);
        }

        [Fact]
        public void GetManagerSubjects_ShouldReturnSubjects_WhenGuidIsValid()
        {
            // Arrange
            var managerId = Guid.NewGuid();
            var expectedSubjects = new List<Subject>
            {
                new Subject { Id = 1, Name = "Math" }
            };

            _mockManagerRepo.Setup(x => x.GetSubjectsByManagerId(managerId)).Returns(expectedSubjects);

            // Act
            var result = _service.GetManagerSubjects(managerId);

            // Assert
            Assert.Same(expectedSubjects, result);
        }

        #endregion

        #region GetQuestionById

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("short")] // < 24 chars
        public void GetQuestionById_ShouldReturnNull_WhenIdIsInvalid(string invalidId)
        {
            // Act
            var result = _service.GetQuestionById(invalidId);

            // Assert
            Assert.Null(result);
            _mockQuestionRepo.Verify(x => x.GetQuestionById(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public void GetQuestionById_ShouldReturnQuestion_WhenIdIsValid()
        {
            // Arrange
            string validId = "60d5ecb8b5c9c62c9c27e311";
            var expectedQuestion = new MultipleChoiceQuestion
            {
                Id = validId,
                QuestionText = "Multi",
                Type = QuestionType.MultipleChoice,
                Options = new List<string>(),
                CorrectAnswer = new List<int>()
            };

            _mockQuestionRepo.Setup(x => x.GetQuestionById(validId)).Returns(expectedQuestion);

            // Act
            var result = _service.GetQuestionById(validId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(validId, result.Id);
            Assert.IsType<MultipleChoiceQuestion>(result);
        }

        #endregion

        #region GetTotalQuestions

        [Fact]
        public void GetTotalQuestions_ShouldReturnCountFromRepo()
        {
            // Arrange
            int subjectId = 2;
            int grade = 12;
            int type = 0;
            string text = "calc";
            int expectedCount = 42;

            _mockQuestionRepo
                .Setup(x => x.GetTotalQuestions(subjectId, grade, type, text))
                .Returns(expectedCount);

            // Act
            var result = _service.GetTotalQuestions(subjectId, grade, type, text);

            // Assert
            Assert.Equal(expectedCount, result);
        }

        #endregion

        #region GetQuestionDashboardOverview

        [Fact]
        public void GetQuestionDashboardOverview_ShouldReturnCorrectCounts_WhenSubjectsAndQuestionsExist()
        {
            // Arrange
            var managerId = Guid.NewGuid();
            var subjects = new List<Subject>
            {
                new Subject { Id = 101, Name = "Mathematics" },
                new Subject { Id = 102, Name = "Physics" }
            };
            var questions = new List<Question>
            {
                new SingleChoiceQuestion
                {
                    Id = "1", QuestionText = "Q1", Type = QuestionType.SingleChoice,
                    SubjectId = 101, Grade = 10, Options = new(), CorrectAnswer = 0
                },
                new MultipleChoiceQuestion
                {
                    Id = "2", QuestionText = "Q2", Type = QuestionType.MultipleChoice,
                    SubjectId = 101, Grade = 10, Options = new(), CorrectAnswer = new()
                },
                new TextInputQuestion
                {
                    Id = "3", QuestionText = "Q3", Type = QuestionType.TextInput,
                    SubjectId = 102, Grade = 12, CorrectAnswer = "A"
                }
            };

            _mockManagerRepo.Setup(x => x.GetSubjectsByManagerId(managerId))
                .Returns(subjects);
            _mockQuestionRepo.Setup(x => x.GetCommonQuestionsBySubjects(It.Is<List<int>>(ids => ids.Contains(101) && ids.Contains(102))))
                .Returns(questions);

            // Act
            var result = _service.GetQuestionDashboardOverview(managerId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalSubjects);
            Assert.Equal(3, result.TotalQuestions);
            Assert.Equal(2, result.TotalGrades);
        }

        [Fact]
        public void GetQuestionDashboardOverview_ShouldReturnZeros_WhenManagerHasNoSubjects()
        {
            // Arrange
            var managerId = Guid.NewGuid();
            var subjects = new List<Subject>();

            _mockManagerRepo.Setup(x => x.GetSubjectsByManagerId(managerId))
                .Returns(subjects);
            _mockQuestionRepo.Setup(x => x.GetCommonQuestionsBySubjects(It.IsAny<List<int>>()))
                .Returns(new List<Question>());

            // Act
            var result = _service.GetQuestionDashboardOverview(managerId);

            // Assert
            Assert.Equal(0, result.TotalSubjects);
            Assert.Equal(0, result.TotalQuestions);
            Assert.Equal(0, result.TotalGrades);
        }

        #endregion

        #region GetQuestionDetailOverview

        [Fact]
        public void GetQuestionDetailOverview_ShouldReturnEmptyList_WhenManagerIdIsEmpty()
        {
            // Arrange
            var managerId = Guid.Empty;

            // Act
            var result = _service.GetQuestionDetailOverview(managerId);

            // Assert
            Assert.Empty(result);
            _mockManagerRepo.Verify(x => x.GetSubjectsByManagerId(It.IsAny<Guid>()), Times.Never);
            _mockQuestionRepo.Verify(x => x.GetCommonQuestionsBySubjects(It.IsAny<List<int>>()), Times.Never);
        }

        [Fact]
        public void GetQuestionDetailOverview_ShouldReturnMappedDtos_WhenDataExists()
        {
            // Arrange
            var managerId = Guid.NewGuid();

            var subjects = new List<Subject>
            {
                new Subject { Id = 5, Name = "History" }
            };

            var questions = new List<Question>
            {
                new FillBlankQuestion
                {
                    Id = "A", QuestionText = "Text",
                    Type = QuestionType.FillBlank,
                    SubjectId = 5,
                    Grade = 11,
                    CorrectAnswer = new List<string>()
                },
                new MatchingQuestion
                {
                    Id = "B", QuestionText = "Match",
                    Type = QuestionType.Matching,
                    SubjectId = 5,
                    Grade = 9,
                    Terms = new(["a", "b"]), Definitions = new(["1", "2"]),
                    CorrectAnswer = new Dictionary<int, int>
                    {
                        { 0, 0 },
                        { 1, 1 }
                    }
                }
            };

            _mockManagerRepo.Setup(x => x.GetSubjectsByManagerId(managerId))
                .Returns(subjects);

            _mockQuestionRepo.Setup(x => x.GetCommonQuestionsBySubjects(It.IsAny<List<int>>()))
                .Returns(questions);

            // Act
            var result = _service.GetQuestionDetailOverview(managerId);

            // Assert
            Assert.Equal(2, result.Count);
            Assert.Equal(5, result[0].SubjectId);
            Assert.Equal(11, result[0].Grade);
            Assert.Equal(QuestionType.FillBlank, result[0].Type);
            Assert.Equal(9, result[1].Grade);
            Assert.Equal(QuestionType.Matching, result[1].Type);
        }

        [Fact]
        public void GetQuestionDetailOverview_ShouldThrowException_IfQuestionDataIsIncoplete()
        {
            // Arrange
            var managerId = Guid.NewGuid();
            var subjects = new List<Subject> { new Subject { Id = 1 } };

            var brokenQuestion = new SingleChoiceQuestion
            {
                Id = "1",
                QuestionText = "Bad Data",
                Type = QuestionType.SingleChoice,
                SubjectId = 1,
                Grade = null,
                Options = new(),
                CorrectAnswer = 0
            };

            _mockManagerRepo.Setup(x => x.GetSubjectsByManagerId(managerId)).Returns(subjects);
            _mockQuestionRepo.Setup(x => x.GetCommonQuestionsBySubjects(It.IsAny<List<int>>()))
                .Returns(new List<Question> { brokenQuestion });

            // Act & Assert
            Assert.Throws<InvalidOperationException>(() => _service.GetQuestionDetailOverview(managerId));
        }

        #endregion

        /// <summary>
        /// Helper to create an IFormFile containing an Excel file in memory
        /// </summary>
        private IFormFile CreateExcelFile(List<string[]> rows)
        {
            var stream = new MemoryStream();

            using (var package = new ExcelPackage())
            {
                var worksheet = package.Workbook.Worksheets.Add("Sheet1");
                worksheet.Cells[1, 1].Value = "Type";
                worksheet.Cells[1, 2].Value = "Question";
                worksheet.Cells[1, 3].Value = "Answer";
                worksheet.Cells[1, 4].Value = "Extra/Option1";

                for (int i = 0; i < rows.Count; i++)
                {
                    for (int j = 0; j < rows[i].Length; j++)
                    {
                        worksheet.Cells[i + 2, j + 1].Value = rows[i][j];
                    }
                }

                package.SaveAs(stream);
            }

            stream.Position = 0;

            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.OpenReadStream()).Returns(stream);
            fileMock.Setup(f => f.FileName).Returns("test.xlsx");
            fileMock.Setup(f => f.Length).Returns(stream.Length);

            return fileMock.Object;
        }

        [Fact]
        public void ImportQuestionsFromExcel_ShouldReturnError_WhenFileIsEmpty()
        {
            // Arrange
            var excelFile = CreateExcelFile(new List<string[]>());

            // Act
            var result = _service.ImportQuestionsFromExcel(excelFile);

            // Assert
            Assert.Empty(result.Questions);
            Assert.Contains("Không có câu hỏi hợp lệ nào được tìm thấy trong file Excel", result.ErrorMessages);
        }

        [Fact]
        public void ImportQuestionsFromExcel_ShouldParse_SingleChoiceQuestion()
        {
            // Arrange
            var rows = new List<string[]>
            {
                new[] { "single-choice", "What is 2+2?", "4", "3", "4", "5" }
            };
            var excelFile = CreateExcelFile(rows);

            // Act
            var result = _service.ImportQuestionsFromExcel(excelFile);

            // Assert
            Assert.Empty(result.ErrorMessages);
            Assert.Single(result.Questions);

            var q = result.Questions[0] as SingleChoiceQuestion;
            Assert.NotNull(q);
            Assert.Equal("What is 2+2?", q.QuestionText);
            Assert.Equal(3, q.Options.Count);
            Assert.Equal(1, q.CorrectAnswer);
        }

        [Fact]
        public void ImportQuestionsFromExcel_ShouldParse_MultipleChoiceQuestion()
        {
            // Arrange
            var rows = new List<string[]>
            {
                new[] { "multiple-choice", "Select Evens", "2, 4", "1", "2", "3", "4" }
            };
            var excelFile = CreateExcelFile(rows);

            // Act
            var result = _service.ImportQuestionsFromExcel(excelFile);

            // Assert
            Assert.Empty(result.ErrorMessages);
            Assert.Single(result.Questions);

            var q = result.Questions[0] as MultipleChoiceQuestion;
            Assert.NotNull(q);
            Assert.Equal(4, q.Options.Count);
            Assert.Equal(2, q.CorrectAnswer.Count);
            Assert.Contains(1, q.CorrectAnswer);
            Assert.Contains(3, q.CorrectAnswer);
        }

        [Fact]
        public void ImportQuestionsFromExcel_ShouldParse_TextInputQuestion()
        {
            // Arrange
            var rows = new List<string[]>
            {
                new[] { "text-input", "Your Name?", "John Doe" }
            };
            var excelFile = CreateExcelFile(rows);

            // Act
            var result = _service.ImportQuestionsFromExcel(excelFile);

            // Assert
            Assert.Empty(result.ErrorMessages);
            var q = result.Questions[0] as TextInputQuestion;
            Assert.NotNull(q);
            Assert.Equal("John Doe", q.CorrectAnswer);
        }

        [Fact]
        public void ImportQuestionsFromExcel_ShouldParse_FillBlankQuestion()
        {
            // Arrange
            var rows = new List<string[]>
            {
                new[] { "fill-blank", "Roses are [BLANK], Violets are [BLANK]", "Red, Blue" }
            };
            var excelFile = CreateExcelFile(rows);

            // Act
            var result = _service.ImportQuestionsFromExcel(excelFile);

            // Assert
            Assert.Empty(result.ErrorMessages);
            var q = result.Questions[0] as FillBlankQuestion;
            Assert.NotNull(q);
            Assert.Equal(2, q.CorrectAnswer.Count);
            Assert.Equal("Red", q.CorrectAnswer[0]);
            Assert.Equal("Blue", q.CorrectAnswer[1]);
        }

        [Fact]
        public void ImportQuestionsFromExcel_ShouldParse_MatchingQuestion()
        {
            // Arrange
            var rows = new List<string[]>
            {
                new[] { "matching", "Match items", "Def1, Def2", "Term1, Term2" }
            };
            var excelFile = CreateExcelFile(rows);

            // Act
            var result = _service.ImportQuestionsFromExcel(excelFile);

            // Assert
            Assert.Empty(result.ErrorMessages);
            var q = result.Questions[0] as MatchingQuestion;
            Assert.NotNull(q);
            Assert.Equal(2, q.Terms.Count);
            Assert.Equal(2, q.Definitions.Count);
            Assert.Equal("Term1", q.Terms[0]);
            Assert.Equal("Def1", q.Definitions[0]);
            Assert.Equal(0, q.CorrectAnswer[0]);
            Assert.Equal(1, q.CorrectAnswer[1]);
        }

        [Fact]
        public void ImportQuestionsFromExcel_ShouldReturnErrors_WhenDataIsInvalid()
        {
            // Arrange
            var rows = new List<string[]>
            {
                new[] { "single-choice", "Missing Answer" }, 
                new[] { "", "No Type", "Ans" }, 
                new[] { "single-choice", "Math?", "5", "1", "2" }, 
                new[] { "fill-blank", "One [BLANK]", "A, B" }, 
                new[] { "unknown-type", "Text", "Ans" }
            };
            var excelFile = CreateExcelFile(rows);

            // Act
            var result = _service.ImportQuestionsFromExcel(excelFile);

            // Assert
            Assert.Empty(result.Questions);
            Assert.NotEmpty(result.ErrorMessages);
            Assert.Equal(9, result.ErrorMessages.Count);
        }

        [Fact]
        public void ImportQuestionsFromExcel_ShouldHandleException_AndReturnErrorMessage()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.OpenReadStream()).Throws(new IOException("Disk error"));

            // Act
            var result = _service.ImportQuestionsFromExcel(fileMock.Object);

            // Assert
            Assert.Empty(result.Questions);
            Assert.Contains("Có lỗi xảy ra!", result.ErrorMessages);
        }
    }
}