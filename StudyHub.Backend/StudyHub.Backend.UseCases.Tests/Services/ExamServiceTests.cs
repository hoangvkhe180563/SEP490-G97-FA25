using Moq;
using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.UseCases.Repositories.Exam;
using StudyHub.Backend.UseCases.Services;
using System.Text.Json;

namespace StudyHub.Backend.UseCases.Tests.Services
{
    public class ExamServiceTests
    {
        private readonly Mock<IExamRepository> _mockExamRepo;
        private readonly Mock<IExamResultRepository> _mockExamResultRepo;
        private readonly Mock<IQuestionRepository> _mockQuestionRepo;
        private readonly Mock<IAnswerRepository> _mockAnswerRepo;
        private readonly ExamService _service;

        public ExamServiceTests()
        {
            _mockExamRepo = new Mock<IExamRepository>();
            _mockExamResultRepo = new Mock<IExamResultRepository>();
            _mockQuestionRepo = new Mock<IQuestionRepository>();
            _mockAnswerRepo = new Mock<IAnswerRepository>();

            _service = new ExamService(
                _mockExamRepo.Object,
                _mockExamResultRepo.Object,
                _mockQuestionRepo.Object,
                _mockAnswerRepo.Object
            );
        }

        [Fact]
        public void GetAllClassExamsByStudent_ShouldReturnEmpty_WhenStudentIdInvalid()
        {
            //Arrange
            Guid studentId = Guid.Empty;
            _mockExamRepo.Setup(x => x.GetAllClassExamsByStudent(Guid.Empty)).Returns([]);

            //Act
            var result = _service.GetAllClassExamsByStudent(studentId);
            //Assert
            Assert.Empty(result);
            _mockExamRepo.Verify(m => m.GetAllClassExamsByStudent(studentId), Times.Never);
        }

        [Fact]
        public void GetAllClassExamsByStudent_ShouldReturnListExams_WhenStudentIdValid()
        {
            //Arrange
            Guid studentId = Guid.NewGuid();
            var classExamList = new List<Exam>
            {
                new Exam
                {
                    Id = 1,
                    Title = "Test 1",
                    Description = "Test 1",
                    Duration = 1,
                    OpenTime = DateTime.Now,
                    CloseTime = DateTime.Now.AddMinutes(10),
                    ShowAnswers = true,
                    ShowCorrectAnswers = true
                },
                new Exam
                {
                    Id = 2,
                    Title = "Test 2",
                    Description = "Test 2",
                    Duration = 2,
                    OpenTime = DateTime.Now,
                    CloseTime = DateTime.Now.AddMinutes(20),
                    ShowAnswers = true,
                    ShowCorrectAnswers = false
                },
            };
            _mockExamRepo.Setup(x => x.GetAllClassExamsByStudent(studentId)).Returns(classExamList);

            //Act
            var result = _service.GetAllClassExamsByStudent(studentId);
            //Assert
            Assert.NotEmpty(result);
            _mockExamRepo.Verify(m => m.GetAllClassExamsByStudent(studentId), Times.Once);
        }

        [Fact]
        public void GetAllClassExams_ShouldReturnEmpty_WhenClassIdInvalid()
        {
            //Arrange
            int classId = 0;
            _mockExamRepo.Setup(x => x.GetAllClassExams(classId)).Returns([]);

            //Act
            var result = _service.GetAllClassExams(classId);
            //Assert
            Assert.Empty(result);
            _mockExamRepo.Verify(m => m.GetAllClassExams(classId), Times.Never);
        }

        [Fact]
        public void GetAllClassExams_ShouldReturnListExams_WhenClassIdValid()
        {
            //Arrange
            int classId = 1;
            var classExamList = new List<Exam>
            {
                new Exam
                {
                    Id = 1,
                    Title = "Test 1",
                    Description = "Test 1",
                    Duration = 1,
                    OpenTime = DateTime.Now,
                    CloseTime = DateTime.Now.AddMinutes(10),
                    ShowAnswers = true,
                    ShowCorrectAnswers = true
                },
                new Exam
                {
                    Id = 2,
                    Title = "Test 2",
                    Description = "Test 2",
                    Duration = 2,
                    OpenTime = DateTime.Now,
                    CloseTime = DateTime.Now.AddMinutes(20),
                    ShowAnswers = true,
                    ShowCorrectAnswers = false
                },
            };
            _mockExamRepo.Setup(x => x.GetAllClassExams(classId)).Returns(classExamList);

            //Act
            var result = _service.GetAllClassExams(classId);
            //Assert
            Assert.NotEmpty(result);
            _mockExamRepo.Verify(m => m.GetAllClassExams(classId), Times.Once);
        }

        [Fact]
        public void GetLessonExam_ShouldReturnNull_WhenExamNotFound()
        {
            // Arrange
            int lessonId = 1;
            _mockExamRepo.Setup(x => x.GetLessonExam(lessonId))
                         .Returns((Exam?)null);

            // Act
            var result = _service.GetLessonExam(lessonId);

            // Assert
            Assert.Null(result);
            _mockExamRepo.Verify(x => x.GetExamQuestionObjectIds(It.IsAny<int>()), Times.Never);
        }

        [Fact]
        public void GetLessonExam_ShouldReturnExamWithQuestions_WhenExamExists()
        {
            // Arrange
            int lessonId = 10;
            int examId = 1;
            var expectedExam = new Exam
            {
                Id = 1,
                Title = "Test 1",
                Description = "Test 1",
                Duration = 1,
                OpenTime = DateTime.Now,
                CloseTime = DateTime.Now.AddMinutes(10),
                ShowAnswers = true,
                ShowCorrectAnswers = true
            };
            var questionIds = new List<string> { "abcdefghijklmnop", "abcdefghijklmnoq" };
            var expectedQuestions = new List<Question>
            {
                new SingleChoiceQuestion
                {
                    Id = "abcdefghijklmnop",
                    QuestionText = "abc",
                    Type = QuestionType.SingleChoice,
                    CorrectAnswer = 1,
                    Options = ["abc", "def"]
                },
                new SingleChoiceQuestion
                {
                    Id = "abcdefghijklmnoq",
                    QuestionText = "abcd",
                    Type = QuestionType.SingleChoice,
                    CorrectAnswer = 1,
                    Options = ["abcd", "defg"]
                },
            };

            _mockExamRepo.Setup(x => x.GetLessonExam(lessonId)).Returns(expectedExam);
            _mockExamRepo.Setup(x => x.GetExamQuestionObjectIds(examId)).Returns(questionIds);
            _mockQuestionRepo.Setup(x => x.GetManyQuestionsById(questionIds)).Returns(expectedQuestions);

            // Act
            var result = _service.GetLessonExam(lessonId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(examId, result!.Id);
            Assert.NotNull(result.Questions);
            Assert.Equal(2, result.Questions.Count);
            _mockExamRepo.Verify(x => x.GetLessonExam(lessonId), Times.Once);
            _mockExamRepo.Verify(x => x.GetExamQuestionObjectIds(examId), Times.Once);
            _mockQuestionRepo.Verify(x => x.GetManyQuestionsById(questionIds), Times.Once);
        }

        [Fact]
        public void GetClassName_ShouldReturnName_WhenCalled()
        {
            // Arrange
            int classId = 99;
            string expectedName = "Advanced Mathematics";
            _mockExamRepo.Setup(x => x.GetClassName(classId)).Returns(expectedName);

            // Act
            var result = _service.GetClassName(classId);

            // Assert
            Assert.Equal(expectedName, result);
            _mockExamRepo.Verify(x => x.GetClassName(classId), Times.Once);
        }

        [Fact]
        public void GetExamById_ShouldReturnNull_WhenExamDoesNotExist()
        {
            // Arrange
            int examId = 1;
            _mockExamRepo.Setup(x => x.GetExamById(examId)).Returns((Exam?)null);

            // Act
            var result = _service.GetExamById(examId, retrieveQuestions: true);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public void GetExamById_ShouldNotRetrieveQuestions_WhenRetrieveQuestionsIsFalse()
        {
            // Arrange
            int examId = 1;
            var expectedExam = new Exam
            {
                Id = 1,
                Title = "Test 1",
                Description = "Test 1",
                Duration = 1,
                OpenTime = DateTime.Now,
                CloseTime = DateTime.Now.AddMinutes(10),
                NoRandomQuestions = null,
                ShowAnswers = true,
                ShowCorrectAnswers = true,
                Questions = []
            };

            _mockExamRepo.Setup(x => x.GetExamById(examId)).Returns(expectedExam);

            // Act
            var result = _service.GetExamById(examId, retrieveQuestions: false);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result!.Questions);
            _mockExamRepo.Verify(x => x.GetExamQuestionObjectIds(It.IsAny<int>()), Times.Never);
            _mockQuestionRepo.Verify(x => x.GetManyQuestionsById(It.IsAny<List<string>>()), Times.Never);
        }

        [Fact]
        public void GetExamById_ShouldNotRetrieveQuestions_WhenNoRandomQuestionsIsNotNull()
        {
            // Arrange
            int examId = 1;
            var expectedExam = new Exam
            {
                Id = 1,
                Title = "Test 1",
                Description = "Test 1",
                Duration = 1,
                OpenTime = DateTime.Now,
                CloseTime = DateTime.Now.AddMinutes(10),
                NoRandomQuestions = 5,
                ShowAnswers = true,
                ShowCorrectAnswers = true
            };

            _mockExamRepo.Setup(x => x.GetExamById(examId)).Returns(expectedExam);

            // Act
            var result = _service.GetExamById(examId, retrieveQuestions: true);

            // Assert
            Assert.NotNull(result);
            _mockExamRepo.Verify(x => x.GetExamQuestionObjectIds(It.IsAny<int>()), Times.Never);
        }

        [Fact]
        public void GetExamById_ShouldRetrieveQuestions_WhenRetrieveTrue_And_NoRandomQuestionsIsNull()
        {
            // Arrange
            int examId = 1;
            var expectedExam = new Exam
            {
                Id = 1,
                Title = "Test 1",
                Description = "Test 1",
                Duration = 1,
                OpenTime = DateTime.Now,
                CloseTime = DateTime.Now.AddMinutes(10),
                NoRandomQuestions = null,
                ShowAnswers = true,
                ShowCorrectAnswers = true
            };
            var questionIds = new List<string> { "id1" };
            var questions = new List<Question> {
                new SingleChoiceQuestion
                {
                    Id = "abcdefghijklmnop",
                    QuestionText = "abc",
                    Type = QuestionType.SingleChoice,
                    CorrectAnswer = 1,
                    Options = ["abc", "def"]
                }
            };

            _mockExamRepo.Setup(x => x.GetExamById(examId)).Returns(expectedExam);
            _mockExamRepo.Setup(x => x.GetExamQuestionObjectIds(examId)).Returns(questionIds);
            _mockQuestionRepo.Setup(x => x.GetManyQuestionsById(questionIds)).Returns(questions);

            // Act
            var result = _service.GetExamById(examId, retrieveQuestions: true);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result!.Questions);
            Assert.Single(result.Questions);
            _mockExamRepo.Verify(x => x.GetExamQuestionObjectIds(examId), Times.Once);
            _mockQuestionRepo.Verify(x => x.GetManyQuestionsById(questionIds), Times.Once);
        }

        [Fact]
        public void CreateExam_ShouldNotCallAddQuestions_WhenNoQuestionsProvided()
        {
            // Arrange
            var exam = new Exam
            {
                Title = "Test Exam",
                Description = "Desc",
                OpenTime = DateTime.Now,
                Duration = 60,
                ShowAnswers = true,
                ShowCorrectAnswers = false,
                Questions = new List<Question>()
            };

            _mockExamRepo.Setup(x => x.CreateExam(exam, It.IsAny<List<string>>())).Returns(true);

            // Act
            var result = _service.CreateExam(exam);

            // Assert
            Assert.True(result);
            _mockQuestionRepo.Verify(x => x.AddManyQuestions(It.IsAny<List<Question>>()), Times.Never);
            _mockExamRepo.Verify(x => x.CreateExam(exam, It.Is<List<string>>(l => l.Count == 0)), Times.Once);
        }

        [Fact]
        public void CreateExam_ShouldAddQuestions_WhenQuestionsProvided()
        {
            // Arrange
            var questions = new List<Question>
            {
                new SingleChoiceQuestion { QuestionText = "Q1", Type = QuestionType.SingleChoice, Options = new(), CorrectAnswer = 0 }
            };
            var exam = new Exam
            {
                Title = "Test Exam",
                Description = "Desc",
                OpenTime = DateTime.Now,
                Duration = 60,
                ShowAnswers = true,
                ShowCorrectAnswers = false,
                Questions = questions
            };
            var generatedIds = new List<string> { "new_id_1" };

            _mockQuestionRepo.Setup(x => x.AddManyQuestions(questions)).Returns(generatedIds);
            _mockExamRepo.Setup(x => x.CreateExam(exam, generatedIds)).Returns(true);

            // Act
            var result = _service.CreateExam(exam);

            // Assert
            Assert.True(result);
            _mockQuestionRepo.Verify(x => x.AddManyQuestions(questions), Times.Once);
            _mockExamRepo.Verify(x => x.CreateExam(exam, generatedIds), Times.Once);
        }

        [Fact]
        public void UpdateExam_ShouldCallRepo_AndReturnResult()
        {
            // Arrange
            var exam = new Exam
            {
                Id = 1,
                Title = "Update",
                Description = "Desc",
                OpenTime = DateTime.Now,
                Duration = 60,
                ShowAnswers = true,
                ShowCorrectAnswers = false
            };
            _mockExamRepo.Setup(x => x.UpdateExam(exam)).Returns(true);

            // Act
            var result = _service.UpdateExam(exam);

            // Assert
            Assert.True(result);
            _mockExamRepo.Verify(x => x.UpdateExam(exam), Times.Once);
        }

        [Fact]
        public void UpdateMySQLExamQuestions_ShouldCallRepo_AndReturnResult()
        {
            // Arrange
            int examId = 5;
            var ids = new List<string> { "id1", "id2" };
            _mockExamRepo.Setup(x => x.UpdateExamQuestions(examId, ids)).Returns(true);

            // Act
            var result = _service.UpdateMySQLExamQuestions(examId, ids);

            // Assert
            Assert.True(result);
            _mockExamRepo.Verify(x => x.UpdateExamQuestions(examId, ids), Times.Once);
        }

        [Fact]
        public void UpdateMongoDbExamQuestions_ShouldReturnEmpty_WhenInputListIsEmpty()
        {
            // Arrange
            int examId = 1;
            var emptyQuestions = new List<Question>();
            _mockExamRepo.Setup(x => x.GetExamQuestionObjectIds(examId)).Returns(new List<string> { "old1" });

            // Act
            var result = _service.UpdateMongoDbExamQuestions(examId, emptyQuestions);

            // Assert
            Assert.Empty(result);
            _mockQuestionRepo.Verify(x => x.AddManyQuestions(It.IsAny<List<Question>>()), Times.Never);
            _mockQuestionRepo.Verify(x => x.DeleteManyQuestions(It.IsAny<List<string>>()), Times.Never);
            _mockQuestionRepo.Verify(x => x.UpdateManyQuestions(It.IsAny<List<Question>>()), Times.Never);
        }

        [Fact]
        public void UpdateMongoDbExamQuestions_ShouldAddNewQuestions_WhenIdIsEmptyString()
        {
            // Arrange
            int examId = 1;
            _mockExamRepo.Setup(x => x.GetExamQuestionObjectIds(examId)).Returns(new List<string>());

            var newQuestion = new SingleChoiceQuestion
            {
                Id = string.Empty,
                QuestionText = "New Q",
                Type = QuestionType.SingleChoice,
                Options = new(),
                CorrectAnswer = 0
            };
            var inputList = new List<Question> { newQuestion };
            var newIds = new List<string> { "generated_id_1" };

            _mockQuestionRepo.Setup(x => x.AddManyQuestions(It.IsAny<List<Question>>()))
                             .Returns(newIds);

            // Act
            var result = _service.UpdateMongoDbExamQuestions(examId, inputList);

            // Assert
            _mockQuestionRepo.Verify(x => x.AddManyQuestions(It.Is<List<Question>>(q => q.Count == 1 && q[0].QuestionText == "New Q")), Times.Once);
            _mockQuestionRepo.Verify(x => x.DeleteManyQuestions(It.IsAny<List<string>>()), Times.Never);
            _mockQuestionRepo.Verify(x => x.UpdateManyQuestions(It.IsAny<List<Question>>()), Times.Never);
            Assert.Single(result);
            Assert.Equal("generated_id_1", result[0]);
        }

        [Fact]
        public void UpdateMongoDbExamQuestions_ShouldDeleteQuestions_WhenInputIsMissingDbIds()
        {
            // Arrange
            int examId = 1;
            var dbIds = new List<string> { "A", "B" };
            _mockExamRepo.Setup(x => x.GetExamQuestionObjectIds(examId)).Returns(dbIds);
            var inputList = new List<Question>
            {
                new SingleChoiceQuestion { Id = "A", QuestionText = "Update A", Type = QuestionType.SingleChoice, Options = new(), CorrectAnswer = 0 }
            };
            _mockQuestionRepo.Setup(x => x.UpdateManyQuestions(It.IsAny<List<Question>>())).Returns(true);
            _mockQuestionRepo.Setup(x => x.DeleteManyQuestions(It.IsAny<List<string>>())).Returns(true);

            // Act
            var result = _service.UpdateMongoDbExamQuestions(examId, inputList);

            // Assert
            _mockQuestionRepo.Verify(x => x.DeleteManyQuestions(It.Is<List<string>>(ids => ids.Contains("B") && ids.Count == 1)), Times.Once);
            _mockQuestionRepo.Verify(x => x.UpdateManyQuestions(It.Is<List<Question>>(q => q.Count == 1 && q[0].Id == "A")), Times.Once);
            Assert.Single(result);
            Assert.Contains("A", result);
        }

        [Fact]
        public void UpdateMongoDbExamQuestions_ShouldHandleAddUpdateAndDelete_Simultaneously()
        {
            // Arrange
            int examId = 1;
            var dbIds = new List<string> { "OldId_1", "OldId_To_Delete" };
            _mockExamRepo.Setup(x => x.GetExamQuestionObjectIds(examId)).Returns(dbIds);
            var inputList = new List<Question>
            {
                new SingleChoiceQuestion { Id = "OldId_1", QuestionText = "Updated Text", Type = QuestionType.SingleChoice, Options = new(), CorrectAnswer = 0 },
                new SingleChoiceQuestion { Id = string.Empty, QuestionText = "New Text", Type = QuestionType.SingleChoice, Options = new(), CorrectAnswer = 0 }
            };

            var generatedIds = new List<string> { "New_Gen_Id" };

            _mockQuestionRepo.Setup(x => x.AddManyQuestions(It.IsAny<List<Question>>())).Returns(generatedIds);

            // Act
            var result = _service.UpdateMongoDbExamQuestions(examId, inputList);

            // Assert
            _mockQuestionRepo.Verify(x => x.DeleteManyQuestions(It.Is<List<string>>(l => l.Contains("OldId_To_Delete") && l.Count == 1)), Times.Once);
            _mockQuestionRepo.Verify(x => x.UpdateManyQuestions(It.Is<List<Question>>(l => l.Count == 1 && l[0].Id == "OldId_1")), Times.Once);
            _mockQuestionRepo.Verify(x => x.AddManyQuestions(It.Is<List<Question>>(l => l.Count == 1 && l[0].QuestionText == "New Text")), Times.Once);
            Assert.Equal(2, result.Count);
            Assert.Contains("New_Gen_Id", result);
            Assert.Contains("OldId_1", result);
        }

        [Fact]
        public void GetExamResultsByExamId_ShouldReturnList_WhenCalled()
        {
            // Arrange
            int examId = 101;
            var expectedResults = new List<ExamResult>
            {
                new ExamResult { Id = "r1", ExamId = examId, Score = 80 },
                new ExamResult { Id = "r2", ExamId = examId, Score = 90 }
            };

            _mockExamResultRepo.Setup(x => x.GetExamResultsByExamId(examId))
                               .Returns(expectedResults);

            // Act
            var result = _service.GetExamResultsByExamId(examId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
            _mockExamResultRepo.Verify(x => x.GetExamResultsByExamId(examId), Times.Once);
        }

        [Fact]
        public void GetExamResultById_ShouldReturnNull_WhenResultNotFound()
        {
            // Arrange
            string resultId = "missing_result";
            _mockExamResultRepo.Setup(x => x.GetExamResultById(resultId)).Returns((ExamResult?)null);

            // Act
            var output = _service.GetExamResultById(resultId, isTeacher: true);

            // Assert
            Assert.Null(output);
        }

        [Fact]
        public void GetExamResultById_ShouldReturnNull_WhenExamNotFound()
        {
            // Arrange
            string resultId = "res1";
            int examId = 99;
            var examResult = new ExamResult { Id = resultId, ExamId = examId };

            _mockExamResultRepo.Setup(x => x.GetExamResultById(resultId)).Returns(examResult);
            _mockExamRepo.Setup(x => x.GetExamById(examId)).Returns((Exam?)null);

            // Act
            var output = _service.GetExamResultById(resultId, isTeacher: true);

            // Assert
            Assert.Null(output);
        }

        [Theory]
        [InlineData(true, 0, false, false, true, true)]
        [InlineData(false, 5, false, false, true, true)]
        [InlineData(false, 0, true, false, true, false)]
        [InlineData(false, 0, false, true, false, true)]
        [InlineData(false, 0, false, false, false, false)]
        public void GetExamResultById_ShouldDetermineVisibilityFlagsCorrectly(
            bool isTeacher,
            int lessonId,
            bool examShowAnswers,
            bool examShowCorrect,
            bool expectedShowAnswersArg,
            bool expectedShowCorrectArg)
        {
            // Arrange
            string resultId = "res1";
            int examId = 10;

            var examResult = new ExamResult { Id = resultId, ExamId = examId };
            var exam = new Exam
            {
                Id = examId,
                LessonId = lessonId,
                ShowAnswers = examShowAnswers,
                ShowCorrectAnswers = examShowCorrect,
                Title = "Test",
                Description = "Desc",
                OpenTime = DateTime.Now,
                Duration = 60
            };

            var answers = new List<ExamAnswer> { new ExamAnswer { QuestionId = "q1", JsonAnswers = "A", IsCorrect = true } };

            _mockExamResultRepo.Setup(x => x.GetExamResultById(resultId)).Returns(examResult);
            _mockExamRepo.Setup(x => x.GetExamById(examId)).Returns(exam);

            _mockAnswerRepo.Setup(x => x.GetAnswersByResultId(resultId, expectedShowAnswersArg, expectedShowCorrectArg))
                           .Returns(answers);

            // Act
            var output = _service.GetExamResultById(resultId, isTeacher);

            // Assert
            Assert.NotNull(output);
            Assert.Equal(answers, output!.Answers);
            _mockAnswerRepo.Verify(x => x.GetAnswersByResultId(resultId, expectedShowAnswersArg, expectedShowCorrectArg), Times.Once);
        }

        [Fact]
        public void GetExamQuestionsByResult_ShouldReturnQuestions_WhenIdsFound()
        {
            // Arrange
            string resultId = "res_123";
            var questionIds = new List<string> { "q1", "q2" };
            var questions = new List<Question>
            {
                new SingleChoiceQuestion { Id = "q1", QuestionText = "A", Type = QuestionType.SingleChoice, Options = new(), CorrectAnswer = 0 },
                new SingleChoiceQuestion { Id = "q2", QuestionText = "B", Type = QuestionType.SingleChoice, Options = new(), CorrectAnswer = 1 }
            };

            _mockAnswerRepo.Setup(x => x.GetQuestionIdsByResult(resultId)).Returns(questionIds);
            _mockQuestionRepo.Setup(x => x.GetManyQuestionsById(questionIds)).Returns(questions);

            // Act
            var output = _service.GetExamQuestionsByResult(resultId);

            // Assert
            Assert.Equal(2, output.Count);
            _mockAnswerRepo.Verify(x => x.GetQuestionIdsByResult(resultId), Times.Once);
            _mockQuestionRepo.Verify(x => x.GetManyQuestionsById(questionIds), Times.Once);
        }

        [Fact]
        public void GetExamQuestionsByResult_ShouldHandleEmptyQuestionList()
        {
            // Arrange
            string resultId = "res_empty";
            var emptyIds = new List<string>();
            var emptyQuestions = new List<Question>();

            _mockAnswerRepo.Setup(x => x.GetQuestionIdsByResult(resultId)).Returns(emptyIds);
            _mockQuestionRepo.Setup(x => x.GetManyQuestionsById(emptyIds)).Returns(emptyQuestions);

            // Act
            var output = _service.GetExamQuestionsByResult(resultId);

            // Assert
            Assert.Empty(output);
            _mockAnswerRepo.Verify(x => x.GetQuestionIdsByResult(resultId), Times.Once);
        }

        [Fact]
        public void GetResultsByExamIdAndStudentId_ShouldReturnResults()
        {
            // Arrange
            int examId = 5;
            Guid studentId = Guid.NewGuid();
            var expectedResults = new List<ExamResult> { new ExamResult() };

            _mockExamResultRepo.Setup(x => x.GetResultsByExamIdAndStudentId(examId, studentId))
                               .Returns(expectedResults);

            // Act
            var result = _service.GetResultsByExamIdAndStudentId(examId, studentId);

            // Assert
            Assert.Single(result);
            _mockExamResultRepo.Verify(x => x.GetResultsByExamIdAndStudentId(examId, studentId), Times.Once);
        }

        [Fact]
        public void CreateExamPaper_ShouldCallRepo_AndReturnId()
        {
            // Arrange
            var answers = new List<ExamAnswer>
            {
                new ExamAnswer { QuestionId = "q1", JsonAnswers = "{}", IsCorrect = true }
            };
            string expectedResultId = "new_result_id_123";

            _mockAnswerRepo.Setup(x => x.AddManyAnswers(answers)).Returns(expectedResultId);

            // Act
            var result = _service.CreateExamPaper(answers);

            // Assert
            Assert.Equal(expectedResultId, result);
            _mockAnswerRepo.Verify(x => x.AddManyAnswers(answers), Times.Once);
        }

        [Fact]
        public void CreateExamResult_ShouldCallRepo_AndReturnResult()
        {
            // Arrange
            var result = new ExamResult { ExamId = 1, StudentName = "John Doe" };
            _mockExamResultRepo.Setup(x => x.CreateExamResult(result)).Returns(true);

            // Act
            var success = _service.CreateExamResult(result);

            // Assert
            Assert.True(success);
            _mockExamResultRepo.Verify(x => x.CreateExamResult(result), Times.Once);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void UpdateExamPaper_ShouldReturnFalse_WhenIdIsInvalid(string? invalidId)
        {
            // Arrange
            var answers = new List<ExamAnswer> { new ExamAnswer { QuestionId = "q1", JsonAnswers = "", IsCorrect = false } };

            // Act
            var result = _service.UpdateExamPaper(invalidId!, answers);

            // Assert
            Assert.False(result);
            _mockAnswerRepo.Verify(x => x.UpdateManyAnswers(It.IsAny<string>(), It.IsAny<List<ExamAnswer>>()), Times.Never);
        }

        [Fact]
        public void UpdateExamPaper_ShouldReturnFalse_WhenIdIsTooShort()
        {
            // Arrange
            string shortId = "12345678901234567890123"; // 23 characters
            var answers = new List<ExamAnswer> { new ExamAnswer { QuestionId = "q1", JsonAnswers = "", IsCorrect = false } };

            // Act
            var result = _service.UpdateExamPaper(shortId, answers);

            // Assert
            Assert.False(result);
            _mockAnswerRepo.Verify(x => x.UpdateManyAnswers(It.IsAny<string>(), It.IsAny<List<ExamAnswer>>()), Times.Never);
        }

        [Fact]
        public void UpdateExamPaper_ShouldReturnFalse_WhenAnswersListIsEmpty()
        {
            // Arrange
            string validId = "123456789012345678901234"; // 24 characters
            var emptyAnswers = new List<ExamAnswer>();

            // Act
            var result = _service.UpdateExamPaper(validId, emptyAnswers);

            // Assert
            Assert.False(result);
            _mockAnswerRepo.Verify(x => x.UpdateManyAnswers(It.IsAny<string>(), It.IsAny<List<ExamAnswer>>()), Times.Never);
        }

        [Fact]
        public void UpdateExamPaper_ShouldCallRepo_WhenInputsAreValid()
        {
            // Arrange
            string validId = "507f1f77bcf86cd799439011"; // 24 chars
            var answers = new List<ExamAnswer>
            {
                new ExamAnswer { QuestionId = "q1", JsonAnswers = "A", IsCorrect = true }
            };

            _mockAnswerRepo.Setup(x => x.UpdateManyAnswers(validId, answers)).Returns(true);

            // Act
            var result = _service.UpdateExamPaper(validId, answers);

            // Assert
            Assert.True(result);
            _mockAnswerRepo.Verify(x => x.UpdateManyAnswers(validId, answers), Times.Once);
        }

        [Fact]
        public void UpdateExamResult_ShouldCallRepo_AndReturnResult()
        {
            // Arrange
            var resultEntity = new ExamResult { Id = "r1", Score = 100 };
            _mockExamResultRepo.Setup(x => x.UpdateExamResult(resultEntity)).Returns(true);

            // Act
            var result = _service.UpdateExamResult(resultEntity);

            // Assert
            Assert.True(result);
            _mockExamResultRepo.Verify(x => x.UpdateExamResult(resultEntity), Times.Once);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void CheckIfResultIsSubmitted_ShouldReturnNull_WhenIdIsInvalid(string? invalidId)
        {
            // Act
            var result = _service.CheckIfResultIsSubmitted(invalidId!);

            // Assert
            Assert.Null(result);
            _mockExamResultRepo.Verify(x => x.CheckIfResultIsSubmitted(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public void CheckIfResultIsSubmitted_ShouldReturnTrue_WhenRepoReturnsTrue()
        {
            // Arrange
            string resultId = "valid_id";
            _mockExamResultRepo.Setup(x => x.CheckIfResultIsSubmitted(resultId)).Returns(true);

            // Act
            var result = _service.CheckIfResultIsSubmitted(resultId);

            // Assert
            Assert.NotNull(result);
            Assert.True(result);
            _mockExamResultRepo.Verify(x => x.CheckIfResultIsSubmitted(resultId), Times.Once);
        }

        [Fact]
        public void CheckIfResultIsSubmitted_ShouldReturnFalse_WhenRepoReturnsFalse()
        {
            // Arrange
            string resultId = "valid_id";
            _mockExamResultRepo.Setup(x => x.CheckIfResultIsSubmitted(resultId)).Returns(false);

            // Act
            var result = _service.CheckIfResultIsSubmitted(resultId);

            // Assert
            Assert.NotNull(result);
            Assert.False(result);
        }

        [Fact]
        public void CheckIfResultIsSubmitted_ShouldReturnNull_WhenRepoReturnsNull()
        {
            // Arrange
            string resultId = "missing_id";
            _mockExamResultRepo.Setup(x => x.CheckIfResultIsSubmitted(resultId)).Returns((bool?)null);

            // Act
            var result = _service.CheckIfResultIsSubmitted(resultId);

            // Assert
            Assert.Null(result);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void GenerateRandomQuestions_ShouldReturnEmpty_WhenIdIsInvalid(int invalidId)
        {
            //Act
            var result = _service.GenerateRandomQuestions(invalidId);

            //Assert
            Assert.Empty(result);
        }

        [Fact]
        public void GenerateRandomQuestions_ShouldReturnEmpty_WhenExamConfigurationIsMissing()
        {
            // Arrange
            int examId = 1;
            _mockExamRepo.Setup(x => x.GetExamById(examId)).Returns((Exam?)null);
            Assert.Empty(_service.GenerateRandomQuestions(examId));
            _mockExamRepo.Setup(x => x.GetExamById(examId)).Returns(new Exam
            {
                Id = examId,
                NoRandomQuestions = null,
                SubjectId = 1,
                Grade = 1,
                Title = "",
                Description = "",
                Duration = 0,
                ShowAnswers = false,
                ShowCorrectAnswers = false,
                OpenTime = DateTime.Now
            });
            Assert.Empty(_service.GenerateRandomQuestions(examId));
            _mockExamRepo.Setup(x => x.GetExamById(examId)).Returns(new Exam
            {
                Id = examId,
                NoRandomQuestions = 5,
                SubjectId = null,
                Grade = 1,
                Title = "",
                Description = "",
                Duration = 0,
                ShowAnswers = false,
                ShowCorrectAnswers = false,
                OpenTime = DateTime.Now
            });
            Assert.Empty(_service.GenerateRandomQuestions(examId));
        }

        [Fact]
        public void GenerateRandomQuestions_ShouldCallRepo_WhenConfigIsValid()
        {
            // Arrange
            int examId = 1;
            sbyte count = 10;
            short subjectId = 2;
            sbyte grade = 5;

            var exam = new Exam
            {
                Id = examId,
                NoRandomQuestions = count,
                SubjectId = subjectId,
                Grade = grade,
                Title = "Test",
                Description = "",
                Duration = 60,
                ShowAnswers = true,
                ShowCorrectAnswers = true,
                OpenTime = DateTime.Now
            };

            var expectedQuestions = new List<Question> { new SingleChoiceQuestion { Id = "q1", QuestionText = "T", Type = QuestionType.SingleChoice, Options = new(), CorrectAnswer = 0 } };

            _mockExamRepo.Setup(x => x.GetExamById(examId)).Returns(exam);
            _mockQuestionRepo.Setup(x => x.GenerateRandomQuestions(count, subjectId, grade)).Returns(expectedQuestions);

            // Act
            var result = _service.GenerateRandomQuestions(examId);

            // Assert
            Assert.Single(result);
            _mockQuestionRepo.Verify(x => x.GenerateRandomQuestions(count, subjectId, grade), Times.Once);
        }

        [Fact]
        public void GetCourseIdByLessonId_ShouldReturnZero_WhenIdInvalid()
        {
            Assert.Equal(0, _service.GetCourseIdByLessonId(0));
        }

        [Fact]
        public void GetCourseIdByLessonId_ShouldReturnRepoValue()
        {
            int lessonId = 5;
            int expectedCourseId = 100;
            _mockExamRepo.Setup(x => x.GetCourseIdByLessonId(lessonId)).Returns(expectedCourseId);

            var result = _service.GetCourseIdByLessonId(lessonId);
            Assert.Equal(expectedCourseId, result);
        }

        [Fact]
        public void GetLatestResultIdByLessonId_ShouldReturnEmpty_WhenInputsInvalid()
        {
            Assert.Equal(string.Empty, _service.GetLatestResultIdByLessonId(0, Guid.NewGuid()));
            Assert.Equal(string.Empty, _service.GetLatestResultIdByLessonId(1, Guid.Empty));
        }

        [Fact]
        public void GetLatestResultIdByLessonId_ShouldReturnLastResultId()
        {
            // Arrange
            int lessonId = 1;
            Guid studentId = Guid.NewGuid();
            int examId = 10;

            var exam = new Exam
            {
                Id = examId,
                Title = "",
                Description = "",
                Duration = 0,
                ShowAnswers = false,
                ShowCorrectAnswers = false,
                OpenTime = DateTime.Now
            };
            var results = new List<ExamResult>
            {
                new ExamResult { Id = "old_result" },
                new ExamResult { Id = "latest_result" }
            };

            _mockExamRepo.Setup(x => x.GetLessonExam(lessonId)).Returns(exam);
            _mockExamResultRepo.Setup(x => x.GetExamResultsByExamId(examId)).Returns(results);

            // Act
            var result = _service.GetLatestResultIdByLessonId(lessonId, studentId);

            // Assert
            Assert.Equal("latest_result", result);
        }

        [Fact]
        public void CheckLessonStatus_ShouldReturnNull_WhenInputsInvalidOrExamNotFound()
        {
            Assert.Null(_service.CheckLessonStatus(0, Guid.NewGuid()));
            _mockExamRepo.Setup(x => x.GetLessonExam(It.IsAny<int>())).Returns((Exam?)null);
            Assert.Null(_service.CheckLessonStatus(1, Guid.NewGuid()));
        }

        [Fact]
        public void CheckLessonStatus_ShouldReturnNotDisabled_WhenNoResultsExist()
        {
            // Arrange
            int lessonId = 1;
            Guid studentId = Guid.NewGuid();
            var exam = new Exam
            {
                Id = 10,
                Title = "",
                Description = "",
                Duration = 0,
                ShowAnswers = false,
                ShowCorrectAnswers = false,
                OpenTime = DateTime.Now
            };

            _mockExamRepo.Setup(x => x.GetLessonExam(lessonId)).Returns(exam);
            _mockExamResultRepo.Setup(x => x.GetExamResultsByExamId(10)).Returns(new List<ExamResult>());

            // Act
            dynamic? result = _service.CheckLessonStatus(lessonId, studentId);

            // Assert
            Assert.NotNull(result);
            bool isDisabled = GetProperty<bool>(result, "IsDisabled");
            DateTime latestTime = GetProperty<DateTime>(result, "LatestTime");
            Assert.False(isDisabled);
            Assert.IsType<DateTime>(latestTime);
        }

        private T GetProperty<T>(object obj, string propertyName)
        {
            var propertyInfo = obj.GetType().GetProperty(propertyName);
            if (propertyInfo == null)
                throw new Exception($"Property {propertyName} not found on object.");

            return (T)propertyInfo.GetValue(obj)!;
        }

        [Fact]
        public void CheckLessonStatus_ShouldBeDisabled_WhenMaxAttemptsReached_And_WithinLockTime()
        {
            // Arrange
            int lessonId = 1;
            Guid studentId = Guid.NewGuid();
            var exam = new Exam
            {
                Id = 10,
                Title = "",
                Description = "",
                Duration = 0,
                ShowAnswers = false,
                ShowCorrectAnswers = false,
                OpenTime = DateTime.Now
            };
            var results = new List<ExamResult>
            {
                new ExamResult { SubmissionTime = DateTime.Now.AddDays(-1) },
                new ExamResult { SubmissionTime = DateTime.Now.AddDays(-1) },
                new ExamResult { SubmissionTime = DateTime.Now.AddHours(-1) }
            };

            _mockExamRepo.Setup(x => x.GetLessonExam(lessonId)).Returns(exam);
            _mockExamResultRepo.Setup(x => x.GetExamResultsByExamId(10)).Returns(results);

            // Act
            dynamic? result = _service.CheckLessonStatus(lessonId, studentId);

            // Assert
            Assert.NotNull(result);
            bool isDisabled = GetProperty<bool>(result, "IsDisabled");
            DateTime latestTime = GetProperty<DateTime>(result, "LatestTime");
            Assert.True(isDisabled);
            Assert.Equal(results[2].SubmissionTime, latestTime);
        }

        [Fact]
        public void CheckLessonStatus_ShouldNotBeDisabled_WhenMaxAttemptsReached_But_LockTimeExpired()
        {
            // Arrange
            int lessonId = 1;
            Guid studentId = Guid.NewGuid();
            var exam = new Exam
            {
                Id = 10,
                Title = "",
                Description = "",
                Duration = 0,
                ShowAnswers = false,
                ShowCorrectAnswers = false,
                OpenTime = DateTime.Now
            };
            var results = new List<ExamResult>
            {
                new ExamResult { SubmissionTime = DateTime.Now.AddDays(-2) },
                new ExamResult { SubmissionTime = DateTime.Now.AddDays(-2) },
                new ExamResult { SubmissionTime = DateTime.Now.AddHours(-9) }
            };

            _mockExamRepo.Setup(x => x.GetLessonExam(lessonId)).Returns(exam);
            _mockExamResultRepo.Setup(x => x.GetExamResultsByExamId(10)).Returns(results);

            // Act
            dynamic? result = _service.CheckLessonStatus(lessonId, studentId);

            // Assert
            bool isDisabled = GetProperty<bool>(result, "IsDisabled");
            Assert.False(isDisabled);
        }

        [Fact]
        public void CheckLessonStatus_ShouldNotBeDisabled_WhenNotMaxAttempts()
        {
            // Arrange
            int lessonId = 1;
            Guid studentId = Guid.NewGuid();
            var exam = new Exam
            {
                Id = 10,
                Title = "",
                Description = "",
                Duration = 0,
                ShowAnswers = false,
                ShowCorrectAnswers = false,
                OpenTime = DateTime.Now
            };
            var results = new List<ExamResult>
            {
                new ExamResult { SubmissionTime = DateTime.Now.AddHours(-1) },
                new ExamResult { SubmissionTime = DateTime.Now.AddHours(-1) }
            };

            _mockExamRepo.Setup(x => x.GetLessonExam(lessonId)).Returns(exam);
            _mockExamResultRepo.Setup(x => x.GetExamResultsByExamId(10)).Returns(results);

            // Act
            dynamic? result = _service.CheckLessonStatus(lessonId, studentId);

            // Assert
            bool isDisabled = GetProperty<bool>(result, "IsDisabled");
            Assert.False(isDisabled);
        }

        [Fact]
        public void GetProcessingExamResult_ShouldReturnNull_WhenNoResultIsProcessing()
        {
            // Arrange
            int examId = 1;
            Guid studentId = Guid.NewGuid();
            var results = new List<ExamResult>
            {
                new ExamResult { Id = "r1", SubmissionTime = DateTime.Now }
            };

            _mockExamResultRepo.Setup(x => x.GetResultsByExamIdAndStudentId(examId, studentId))
                               .Returns(results);

            // Act
            var result = _service.GetProcessingExamResult(examId, studentId);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public void GetProcessingExamResult_ShouldReturnResultWithAnswers_WhenProcessingFound()
        {
            // Arrange
            int examId = 1;
            Guid studentId = Guid.NewGuid();
            string processingResultId = "proc_1";

            var results = new List<ExamResult>
            {
                new ExamResult { Id = "finished_1", SubmissionTime = DateTime.Now },
                new ExamResult { Id = processingResultId, SubmissionTime = null }
            };

            var answers = new List<ExamAnswer> { new ExamAnswer { QuestionId = "q1", JsonAnswers = "", IsCorrect = false } };

            _mockExamResultRepo.Setup(x => x.GetResultsByExamIdAndStudentId(examId, studentId))
                               .Returns(results);
            _mockAnswerRepo.Setup(x => x.GetAnswersByResultId(processingResultId, true, false))
                           .Returns(answers);

            // Act
            var result = _service.GetProcessingExamResult(examId, studentId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(processingResultId, result!.Id);
            Assert.Equal(answers, result.Answers);

            _mockAnswerRepo.Verify(x => x.GetAnswersByResultId(processingResultId, true, false), Times.Once);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("short_id")] // < 24 chars
        public void SubmitExamResult_ShouldReturnFalse_WhenIdIsInvalid(string? invalidId)
        {
            var result = _service.SubmitExamResult(invalidId!);
            Assert.False(result);
            _mockAnswerRepo.Verify(x => x.GetAnswersByResultId(It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<bool>()), Times.Never);
        }

        [Fact]
        public void SubmitExamResult_ShouldGradeCorrectly_AllTypes_PerfectScore()
        {
            // Arrange
            string resultId = "507f1f77bcf86cd799439011";
            int examId = 100;
            var q1 = new SingleChoiceQuestion { Id = "q1", Type = QuestionType.SingleChoice, CorrectAnswer = 1, QuestionText = "", Options = new() };
            var q2 = new MultipleChoiceQuestion { Id = "q2", Type = QuestionType.MultipleChoice, CorrectAnswer = new List<int> { 0, 2 }, QuestionText = "", Options = new() };
            var q3 = new TextInputQuestion { Id = "q3", Type = QuestionType.TextInput, CorrectAnswer = "Hello World", QuestionText = "" };
            var q4 = new FillBlankQuestion { Id = "q4", Type = QuestionType.FillBlank, CorrectAnswer = new List<string> { "Red", "Blue" }, QuestionText = "" };
            var q5 = new MatchingQuestion { Id = "q5", QuestionText = "abc", Type = QuestionType.Matching, CorrectAnswer = new Dictionary<int, int> { { 1, 10 }, { 2, 20 } }, Terms = new(), Definitions = new() };

            var questions = new List<Question> { q1, q2, q3, q4, q5 };
            var questionIds = questions.Select(q => q.Id).ToList();

            var answers = new List<ExamAnswer>
            {
                new ExamAnswer { QuestionId = "q1", JsonAnswers = "1", IsCorrect = false },
                new ExamAnswer { QuestionId = "q2", JsonAnswers = JsonSerializer.Serialize(new List<int> { 0, 2 }), IsCorrect = false },
                new ExamAnswer { QuestionId = "q3", JsonAnswers = "\"hello world \"", IsCorrect = false },
                new ExamAnswer { QuestionId = "q4", JsonAnswers = JsonSerializer.Serialize(new List<string> { " red ", "BLUE" }), IsCorrect = false },
                new ExamAnswer { QuestionId = "q5", JsonAnswers = JsonSerializer.Serialize(new Dictionary<string, int> { { "1", 10 }, { "2", 20 } }), IsCorrect = false }
            };

            // 3. Mocks
            _mockAnswerRepo.Setup(x => x.GetAnswersByResultId(resultId, true, false)).Returns(answers);
            _mockQuestionRepo.Setup(x => x.GetManyQuestionsById(It.IsAny<List<string>>())).Returns(questions);
            _mockAnswerRepo.Setup(x => x.UpdateManyAnswers(resultId, answers)).Returns(true);
            _mockExamResultRepo.Setup(x => x.SubmitExam(It.IsAny<ExamResult>())).Returns(true);
            _mockExamRepo.Setup(x => x.GetExamIdByResultId(resultId)).Returns(examId);
            _mockExamRepo.Setup(x => x.GetExamById(examId)).Returns(new Exam
            {
                Id = examId,
                LessonId = 0,
                Title = "",
                Description = "",
                Duration = 0,
                ShowAnswers = false,
                ShowCorrectAnswers = false,
                OpenTime = DateTime.Now
            });

            // Act
            var success = _service.SubmitExamResult(resultId);

            // Assert
            Assert.True(success);
            _mockExamResultRepo.Verify(x => x.SubmitExam(It.Is<ExamResult>(r => r.Score == 10m)), Times.Once);
            Assert.All(answers, a => Assert.True(a.IsCorrect));
        }

        [Fact]
        public void SubmitExamResult_ShouldGradeCorrectly_MixedResults_PartialScore()
        {
            // Arrange
            string resultId = "507f1f77bcf86cd799439011";
            var q1 = new SingleChoiceQuestion { Id = "q1", Type = QuestionType.SingleChoice, CorrectAnswer = 1, QuestionText = "", Options = new() };
            var q2 = new MultipleChoiceQuestion { Id = "q2", Type = QuestionType.MultipleChoice, CorrectAnswer = new List<int> { 0, 2 }, QuestionText = "", Options = new() };
            var q3 = new TextInputQuestion { Id = "q3", Type = QuestionType.TextInput, CorrectAnswer = "Yes", QuestionText = "" };

            var questions = new List<Question> { q1, q2, q3 };

            var answers = new List<ExamAnswer>
            {
                new ExamAnswer { QuestionId = "q1", JsonAnswers = "2", IsCorrect = false }, // Wrong (Correct is 1)
                new ExamAnswer { QuestionId = "q2", JsonAnswers = JsonSerializer.Serialize(new List<int> { 0 }), IsCorrect = false }, // Missing option 2
                new ExamAnswer { QuestionId = "q3", JsonAnswers = "\"YES\"", IsCorrect = false } // Correct (Case insensitive)
            };

            _mockAnswerRepo.Setup(x => x.GetAnswersByResultId(resultId, true, false)).Returns(answers);
            _mockQuestionRepo.Setup(x => x.GetManyQuestionsById(It.IsAny<List<string>>())).Returns(questions);
            _mockAnswerRepo.Setup(x => x.UpdateManyAnswers(resultId, answers)).Returns(true);
            _mockExamResultRepo.Setup(x => x.SubmitExam(It.IsAny<ExamResult>())).Returns(true);
            _mockExamRepo.Setup(x => x.GetExamIdByResultId(resultId)).Returns(1);
            _mockExamRepo.Setup(x => x.GetExamById(1)).Returns(new Exam {
                Id = 1,
                LessonId = 0,
                Title = "",
                Description = "",
                Duration = 0,
                ShowAnswers = false,
                ShowCorrectAnswers = false,
                OpenTime = DateTime.Now
            });

            // Act
            var success = _service.SubmitExamResult(resultId);

            // Assert
            Assert.True(success);
            _mockExamResultRepo.Verify(x => x.SubmitExam(It.Is<ExamResult>(r => r.Score > 3.3m && r.Score < 3.4m)), Times.Once);

            Assert.False(answers[0].IsCorrect);
            Assert.False(answers[1].IsCorrect);
            Assert.True(answers[2].IsCorrect);
        }

        [Fact]
        public void SubmitExamResult_ShouldHandleMatchingQuestions_Incorrectly()
        {
            // Arrange
            string resultId = "507f1f77bcf86cd799439011";
            var q1 = new MatchingQuestion
            {
                Id = "q1",
                QuestionText = "abc",
                Type = QuestionType.Matching,
                CorrectAnswer = new Dictionary<int, int> { { 1, 10 }, { 2, 20 } },
                Terms = new(),
                Definitions = new()
            };

            var answers = new List<ExamAnswer>
            {
                new ExamAnswer { QuestionId = "q1", JsonAnswers = JsonSerializer.Serialize(new Dictionary<string, int> { { "1", 10 }, { "2", 99 } }), IsCorrect = false }
            };

            _mockAnswerRepo.Setup(x => x.GetAnswersByResultId(resultId, true, false)).Returns(answers);
            _mockQuestionRepo.Setup(x => x.GetManyQuestionsById(It.IsAny<List<string>>())).Returns(new List<Question> { q1 });
            _mockAnswerRepo.Setup(x => x.UpdateManyAnswers(resultId, answers)).Returns(true);
            _mockExamResultRepo.Setup(x => x.SubmitExam(It.IsAny<ExamResult>())).Returns(true);
            _mockExamRepo.Setup(x => x.GetExamIdByResultId(resultId)).Returns(1);
            _mockExamRepo.Setup(x => x.GetExamById(1)).Returns(
                new Exam
                {
                    Id = 1,
                    LessonId = 0,
                    Title = "",
                    Description = "",
                    Duration = 0,
                    ShowAnswers = false,
                    ShowCorrectAnswers = false,
                    OpenTime = DateTime.Now
                });

            // Act
            _service.SubmitExamResult(resultId);

            // Assert
            Assert.False(answers[0].IsCorrect);
            _mockExamResultRepo.Verify(x => x.SubmitExam(It.Is<ExamResult>(r => r.Score == 0)), Times.Once);
        }

        [Fact]
        public void SubmitExamResult_ShouldCreateProgress_WhenExamIsLessonExam()
        {
            // Arrange
            string resultId = "507f1f77bcf86cd799439011";
            int examId = 5;
            int lessonId = 99;
            int enrollmentId = 500;
            var q1 = new TextInputQuestion { Id = "q1", Type = QuestionType.TextInput, CorrectAnswer = "A", QuestionText = "" };
            var answers = new List<ExamAnswer> { new ExamAnswer { QuestionId = "q1", JsonAnswers = "\"A\"", IsCorrect = false } };

            _mockAnswerRepo.Setup(x => x.GetAnswersByResultId(resultId, true, false)).Returns(answers);
            _mockQuestionRepo.Setup(x => x.GetManyQuestionsById(It.IsAny<List<string>>())).Returns(new List<Question> { q1 });
            _mockAnswerRepo.Setup(x => x.UpdateManyAnswers(resultId, answers)).Returns(true);
            _mockExamResultRepo.Setup(x => x.SubmitExam(It.IsAny<ExamResult>())).Returns(true);

            _mockExamRepo.Setup(x => x.GetExamIdByResultId(resultId)).Returns(examId);
            _mockExamRepo.Setup(x => x.GetExamById(examId)).Returns(new Exam
            {
                Id = examId,
                LessonId = lessonId,
                Title = "",
                Description = "",
                Duration = 0,
                ShowAnswers = false,
                ShowCorrectAnswers = false,
                OpenTime = DateTime.Now
            });

            // Lesson Progress Mocks
            _mockExamResultRepo.Setup(x => x.GetEnrollmentId(resultId, lessonId)).Returns(enrollmentId);
            _mockExamResultRepo.Setup(x => x.CreateProgress(enrollmentId, lessonId)).Returns(true);

            // Act
            var success = _service.SubmitExamResult(resultId);

            // Assert
            Assert.True(success);
            _mockExamResultRepo.Verify(x => x.CreateProgress(enrollmentId, lessonId), Times.Once);
        }

        [Fact]
        public void SubmitExamResult_ShouldFail_WhenLessonEnrollmentNotFound()
        {
            // Arrange
            string resultId = "507f1f77bcf86cd799439011";
            int examId = 5;
            int lessonId = 99;

            var q1 = new TextInputQuestion { Id = "q1", Type = QuestionType.TextInput, CorrectAnswer = "A", QuestionText = "" };
            var answers = new List<ExamAnswer> { new ExamAnswer { QuestionId = "q1", JsonAnswers = "\"A\"", IsCorrect = false } };

            _mockAnswerRepo.Setup(x => x.GetAnswersByResultId(resultId, true, false)).Returns(answers);
            _mockQuestionRepo.Setup(x => x.GetManyQuestionsById(It.IsAny<List<string>>())).Returns(new List<Question> { q1 });
            _mockAnswerRepo.Setup(x => x.UpdateManyAnswers(resultId, answers)).Returns(true);
            _mockExamResultRepo.Setup(x => x.SubmitExam(It.IsAny<ExamResult>())).Returns(true);

            _mockExamRepo.Setup(x => x.GetExamIdByResultId(resultId)).Returns(examId);
            _mockExamRepo.Setup(x => x.GetExamById(examId)).Returns(
                new Exam
                {
                    Id = examId,
                    LessonId = lessonId,
                    Title = "",
                    Description = "",
                    Duration = 0,
                    ShowAnswers = false,
                    ShowCorrectAnswers = false,
                    OpenTime = DateTime.Now
                });

            // Fail case: Enrollment returns 0
            _mockExamResultRepo.Setup(x => x.GetEnrollmentId(resultId, lessonId)).Returns(0);

            // Act
            var success = _service.SubmitExamResult(resultId);

            // Assert
            Assert.False(success);
            _mockExamResultRepo.Verify(x => x.CreateProgress(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }

        [Fact]
        public void SubmitExamResult_ShouldReturnFalse_WhenUpdatingAnswersFails()
        {
            // Arrange
            string resultId = "507f1f77bcf86cd799439011";
            var answers = new List<ExamAnswer> { new ExamAnswer { QuestionId = "q1", JsonAnswers = "1", IsCorrect = false } };
            var questions = new List<Question> { new SingleChoiceQuestion { Id = "q1", Type = QuestionType.SingleChoice, CorrectAnswer = 1, QuestionText = "", Options = new() } };

            _mockAnswerRepo.Setup(x => x.GetAnswersByResultId(resultId, true, false)).Returns(answers);
            _mockQuestionRepo.Setup(x => x.GetManyQuestionsById(It.IsAny<List<string>>())).Returns(questions);

            // Fail here
            _mockAnswerRepo.Setup(x => x.UpdateManyAnswers(resultId, answers)).Returns(false);

            // Act
            var result = _service.SubmitExamResult(resultId);

            // Assert
            Assert.False(result);
            // Verify execution stopped
            _mockExamResultRepo.Verify(x => x.SubmitExam(It.IsAny<ExamResult>()), Times.Never);
        }

        [Fact]
        public void SubmitExamResult_ShouldReturnFalse_WhenSubmittingResultFails()
        {
            // Arrange
            string resultId = "507f1f77bcf86cd799439011";
            var answers = new List<ExamAnswer> { new ExamAnswer { QuestionId = "q1", JsonAnswers = "1", IsCorrect = false } };
            var questions = new List<Question> { new SingleChoiceQuestion { Id = "q1", Type = QuestionType.SingleChoice, CorrectAnswer = 1, QuestionText = "", Options = new() } };

            _mockAnswerRepo.Setup(x => x.GetAnswersByResultId(resultId, true, false)).Returns(answers);
            _mockQuestionRepo.Setup(x => x.GetManyQuestionsById(It.IsAny<List<string>>())).Returns(questions);
            _mockAnswerRepo.Setup(x => x.UpdateManyAnswers(resultId, answers)).Returns(true);

            // Fail here
            _mockExamResultRepo.Setup(x => x.SubmitExam(It.IsAny<ExamResult>())).Returns(false);

            // Act
            var result = _service.SubmitExamResult(resultId);

            // Assert
            Assert.False(result);
        }
    }
}