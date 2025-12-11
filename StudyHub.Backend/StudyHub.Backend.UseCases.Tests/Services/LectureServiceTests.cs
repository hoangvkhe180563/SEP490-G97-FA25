using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class LectureServiceTests
{
    #region Chapter Tests

    [Fact]
    public void GetChaptersForCourse_ShouldReturnChapters_WhenChaptersExist()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var courseId = 1;
        var chapters = new List<Chapter>
        {
            new Chapter
            {
                Id = 1,
                Name = "Chapter 1",
                CourseId = courseId,
                Description = "Introduction",
                PostDate = DateTime.Now
            },
            new Chapter
            {
                Id = 2,
                Name = "Chapter 2",
                CourseId = courseId,
                Description = "Advanced Topics",
                PostDate = DateTime.Now
            }
        };

        mockChapterRepo.Setup(x => x.GetChaptersByCourseId(courseId))
            .Returns(chapters);

        // Act
        var result = lectureService.GetChaptersForCourse(courseId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal("Chapter 1", result[0].Name);
        Assert.Equal("Chapter 2", result[1].Name);
        mockChapterRepo.Verify(x => x.GetChaptersByCourseId(courseId), Times.Once);
    }

    [Fact]
    public void GetChaptersForCourse_ShouldReturnEmptyList_WhenNoChaptersExist()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var courseId = 999;
        mockChapterRepo.Setup(x => x.GetChaptersByCourseId(courseId))
            .Returns(new List<Chapter>());

        // Act
        var result = lectureService.GetChaptersForCourse(courseId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
        mockChapterRepo.Verify(x => x.GetChaptersByCourseId(courseId), Times.Once);
    }

    [Fact]
    public void GetChapter_ShouldReturnChapter_WhenChapterExists()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var chapterId = 1;
        var chapter = new Chapter
        {
            Id = chapterId,
            Name = "Chapter 1",
            CourseId = 1,
            Description = "Introduction"
        };

        mockChapterRepo.Setup(x => x.GetChapterById(chapterId))
            .Returns(chapter);

        // Act
        var result = lectureService.GetChapter(chapterId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(chapterId, result.Id);
        Assert.Equal("Chapter 1", result.Name);
        mockChapterRepo.Verify(x => x.GetChapterById(chapterId), Times.Once);
    }

    [Fact]
    public void GetChapter_ShouldReturnNull_WhenChapterDoesNotExist()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var chapterId = 999;
        mockChapterRepo.Setup(x => x.GetChapterById(chapterId))
            .Returns((Chapter?)null);

        // Act
        var result = lectureService.GetChapter(chapterId);

        // Assert
        Assert.Null(result);
        mockChapterRepo.Verify(x => x.GetChapterById(chapterId), Times.Once);
    }

    [Fact]
    public void CreateChapter_ShouldCreateAndReturnChapter_WhenValidDataProvided()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var newChapter = new Chapter
        {
            Name = "New Chapter",
            CourseId = 1,
            Description = "New chapter description"
        };

        var createdChapter = new Chapter
        {
            Id = 1,
            Name = newChapter.Name,
            CourseId = newChapter.CourseId,
            Description = newChapter.Description,
            PostDate = DateTime.Now
        };

        mockChapterRepo.Setup(x => x.CreateChapter(newChapter))
            .Returns(createdChapter);

        // Act
        var result = lectureService.CreateChapter(newChapter);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("New Chapter", result.Name);
        mockChapterRepo.Verify(x => x.CreateChapter(newChapter), Times.Once);
    }

    [Fact]
    public void UpdateChapter_ShouldUpdateAndReturnChapter_WhenValidDataProvided()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var updatedChapter = new Chapter
        {
            Id = 1,
            Name = "Updated Chapter",
            CourseId = 1,
            Description = "Updated description"
        };

        mockChapterRepo.Setup(x => x.UpdateChapter(updatedChapter))
            .Returns(updatedChapter);

        // Act
        var result = lectureService.UpdateChapter(updatedChapter);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Chapter", result.Name);
        Assert.Equal("Updated description", result.Description);
        mockChapterRepo.Verify(x => x.UpdateChapter(updatedChapter), Times.Once);
    }

    [Fact]
    public void DeleteChapter_ShouldReturnTrue_WhenChapterDeletedSuccessfully()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var chapterId = 1;
        mockChapterRepo.Setup(x => x.DeleteChapter(chapterId))
            .Returns(true);

        // Act
        var result = lectureService.DeleteChapter(chapterId);

        // Assert
        Assert.True(result);
        mockChapterRepo.Verify(x => x.DeleteChapter(chapterId), Times.Once);
    }

    [Fact]
    public void DeleteChapter_ShouldReturnFalse_WhenChapterDeletionFails()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var chapterId = 999;
        mockChapterRepo.Setup(x => x.DeleteChapter(chapterId))
            .Returns(false);

        // Act
        var result = lectureService.DeleteChapter(chapterId);

        // Assert
        Assert.False(result);
        mockChapterRepo.Verify(x => x.DeleteChapter(chapterId), Times.Once);
    }

    #endregion

    #region Lesson Tests

    [Fact]
    public void GetLessonsForChapter_ShouldReturnLessons_WhenLessonsExist()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var chapterId = 1;
        var lessons = new List<Lesson>
        {
            new Lesson
            {
                Id = 1,
                Name = "Lesson 1",
                ChapterId = chapterId,
                Type = "video",
                Duration = "10:00"
            },
            new Lesson
            {
                Id = 2,
                Name = "Lesson 2",
                ChapterId = chapterId,
                Type = "reading",
                Duration = "15:00"
            }
        };

        mockLessonRepo.Setup(x => x.GetLessonsByChapterId(chapterId))
            .Returns(lessons);

        // Act
        var result = lectureService.GetLessonsForChapter(chapterId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal("Lesson 1", result[0].Name);
        Assert.Equal("Lesson 2", result[1].Name);
        mockLessonRepo.Verify(x => x.GetLessonsByChapterId(chapterId), Times.Once);
    }

    [Fact]
    public void GetLessonsForChapter_ShouldReturnEmptyList_WhenNoLessonsExist()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var chapterId = 999;
        mockLessonRepo.Setup(x => x.GetLessonsByChapterId(chapterId))
            .Returns(new List<Lesson>());

        // Act
        var result = lectureService.GetLessonsForChapter(chapterId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
        mockLessonRepo.Verify(x => x.GetLessonsByChapterId(chapterId), Times.Once);
    }

    [Fact]
    public void GetLesson_ShouldReturnLesson_WhenLessonExists()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var lessonId = 1;
        var lesson = new Lesson
        {
            Id = lessonId,
            Name = "Lesson 1",
            ChapterId = 1,
            Type = "video",
            Duration = "10:00"
        };

        mockLessonRepo.Setup(x => x.GetLessonById(lessonId))
            .Returns(lesson);

        // Act
        var result = lectureService.GetLesson(lessonId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(lessonId, result.Id);
        Assert.Equal("Lesson 1", result.Name);
        mockLessonRepo.Verify(x => x.GetLessonById(lessonId), Times.Once);
    }

    [Fact]
    public void GetLesson_ShouldReturnNull_WhenLessonDoesNotExist()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var lessonId = 999;
        mockLessonRepo.Setup(x => x.GetLessonById(lessonId))
            .Returns((Lesson?)null);

        // Act
        var result = lectureService.GetLesson(lessonId);

        // Assert
        Assert.Null(result);
        mockLessonRepo.Verify(x => x.GetLessonById(lessonId), Times.Once);
    }

    [Fact]
    public void CreateLesson_ShouldCreateAndReturnLesson_WhenValidDataProvided()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var newLesson = new Lesson
        {
            Name = "New Lesson",
            ChapterId = 1,
            Type = "video",
            Duration = "12:00",
            Description = "New lesson description"
        };

        var createdLesson = new Lesson
        {
            Id = 1,
            Name = newLesson.Name,
            ChapterId = newLesson.ChapterId,
            Type = newLesson.Type,
            Duration = newLesson.Duration,
            Description = newLesson.Description,
            PostDate = DateTime.Now
        };

        mockLessonRepo.Setup(x => x.CreateLesson(newLesson))
            .Returns(createdLesson);

        // Act
        var result = lectureService.CreateLesson(newLesson);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("New Lesson", result.Name);
        mockLessonRepo.Verify(x => x.CreateLesson(newLesson), Times.Once);
    }

    [Fact]
    public void UpdateLesson_ShouldUpdateAndReturnLesson_WhenValidDataProvided()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var updatedLesson = new Lesson
        {
            Id = 1,
            Name = "Updated Lesson",
            ChapterId = 1,
            Type = "reading",
            Duration = "20:00",
            Description = "Updated description"
        };

        mockLessonRepo.Setup(x => x.UpdateLesson(updatedLesson))
            .Returns(updatedLesson);

        // Act
        var result = lectureService.UpdateLesson(updatedLesson);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Lesson", result.Name);
        Assert.Equal("reading", result.Type);
        mockLessonRepo.Verify(x => x.UpdateLesson(updatedLesson), Times.Once);
    }

    [Fact]
    public void DeleteLesson_ShouldReturnTrue_WhenLessonDeletedSuccessfully()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var lessonId = 1;
        mockLessonRepo.Setup(x => x.DeleteLesson(lessonId))
            .Returns(true);

        // Act
        var result = lectureService.DeleteLesson(lessonId);

        // Assert
        Assert.True(result);
        mockLessonRepo.Verify(x => x.DeleteLesson(lessonId), Times.Once);
    }

    [Fact]
    public void DeleteLesson_ShouldReturnFalse_WhenLessonDeletionFails()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var lessonId = 999;
        mockLessonRepo.Setup(x => x.DeleteLesson(lessonId))
            .Returns(false);

        // Act
        var result = lectureService.DeleteLesson(lessonId);

        // Assert
        Assert.False(result);
        mockLessonRepo.Verify(x => x.DeleteLesson(lessonId), Times.Once);
    }

    #endregion

    #region InteractiveQuestion Tests

    [Fact]
    public void GetInteractiveQuestions_ShouldReturnQuestions_WhenQuestionsExist()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var lessonId = 1;
        var questions = new List<InteractiveQuestion>
        {
            new InteractiveQuestion
            {
                Id = 1,
                LessonId = lessonId,
                QuestionText = "What is C#?",
                Type = "mc",
                TimeSec = 120,
                CorrectIndex = 0
            },
            new InteractiveQuestion
            {
                Id = 2,
                LessonId = lessonId,
                QuestionText = "Explain OOP",
                Type = "text",
                TimeSec = 300,
                CorrectAnswer = "Object-oriented programming"
            }
        };

        mockQuestionRepo.Setup(x => x.GetByLessonId(lessonId))
            .Returns(questions);

        // Act
        var result = lectureService.GetInteractiveQuestions(lessonId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal("What is C#?", result[0].QuestionText);
        Assert.Equal("Explain OOP", result[1].QuestionText);
        mockQuestionRepo.Verify(x => x.GetByLessonId(lessonId), Times.Once);
    }

    [Fact]
    public void GetInteractiveQuestions_ShouldReturnEmptyList_WhenNoQuestionsExist()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var lessonId = 999;
        mockQuestionRepo.Setup(x => x.GetByLessonId(lessonId))
            .Returns(new List<InteractiveQuestion>());

        // Act
        var result = lectureService.GetInteractiveQuestions(lessonId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
        mockQuestionRepo.Verify(x => x.GetByLessonId(lessonId), Times.Once);
    }

    [Fact]
    public void CreateInteractiveQuestions_ShouldCreateAndReturnQuestions_WhenValidDataProvided()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var lessonId = 1;
        var newQuestions = new List<InteractiveQuestion>
        {
            new InteractiveQuestion
            {
                QuestionText = "New Question 1",
                Type = "mc",
                TimeSec = 60
            },
            new InteractiveQuestion
            {
                QuestionText = "New Question 2",
                Type = "text",
                TimeSec = 120
            }
        };

        var createdQuestions = new List<InteractiveQuestion>
        {
            new InteractiveQuestion
            {
                Id = 1,
                LessonId = lessonId,
                QuestionText = "New Question 1",
                Type = "mc",
                TimeSec = 60,
                CreatedAt = DateTime.Now
            },
            new InteractiveQuestion
            {
                Id = 2,
                LessonId = lessonId,
                QuestionText = "New Question 2",
                Type = "text",
                TimeSec = 120,
                CreatedAt = DateTime.Now
            }
        };

        mockQuestionRepo.Setup(x => x.CreateForLesson(lessonId, newQuestions))
            .Returns(createdQuestions);

        // Act
        var result = lectureService.CreateInteractiveQuestions(lessonId, newQuestions);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal(lessonId, result[0].LessonId);
        Assert.Equal(lessonId, result[1].LessonId);
        mockQuestionRepo.Verify(x => x.CreateForLesson(lessonId, newQuestions), Times.Once);
    }

    [Fact]
    public void ReplaceInteractiveQuestions_ShouldReplaceAndReturnQuestions_WhenValidDataProvided()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var lessonId = 1;
        var replacementQuestions = new List<InteractiveQuestion>
        {
            new InteractiveQuestion
            {
                QuestionText = "Replacement Question",
                Type = "mc",
                TimeSec = 90
            }
        };

        var replacedQuestions = new List<InteractiveQuestion>
        {
            new InteractiveQuestion
            {
                Id = 10,
                LessonId = lessonId,
                QuestionText = "Replacement Question",
                Type = "mc",
                TimeSec = 90,
                CreatedAt = DateTime.Now
            }
        };

        mockQuestionRepo.Setup(x => x.ReplaceForLesson(lessonId, replacementQuestions))
            .Returns(replacedQuestions);

        // Act
        var result = lectureService.ReplaceInteractiveQuestions(lessonId, replacementQuestions);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Equal("Replacement Question", result[0].QuestionText);
        mockQuestionRepo.Verify(x => x.ReplaceForLesson(lessonId, replacementQuestions), Times.Once);
    }

    #endregion

    #region InteractiveResponse Tests

    [Fact]
    public void CreateInteractiveResponse_ShouldCreateAndReturnResponse_WhenValidDataProvided()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var newResponse = new InteractiveResponse
        {
            LessonId = 1,
            QuestionId = 1,
            AppUserId = Guid.NewGuid(),
            AnswerText = "My answer",
            IsCorrect = true
        };

        var createdResponse = new InteractiveResponse
        {
            Id = 1,
            LessonId = newResponse.LessonId,
            QuestionId = newResponse.QuestionId,
            AppUserId = newResponse.AppUserId,
            AnswerText = newResponse.AnswerText,
            IsCorrect = newResponse.IsCorrect,
            CreatedAt = DateTime.Now
        };

        mockResponseRepo.Setup(x => x.Create(newResponse))
            .Returns(createdResponse);

        // Act
        var result = lectureService.CreateInteractiveResponse(newResponse);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("My answer", result.AnswerText);
        Assert.True(result.IsCorrect);
        mockResponseRepo.Verify(x => x.Create(newResponse), Times.Once);
    }

    [Fact]
    public void CreateInteractiveResponse_ShouldHandleMultipleChoiceResponse_WhenSelectedIndexProvided()
    {
        // Arrange
        var mockChapterRepo = new Mock<IChapterRepository>();
        var mockLessonRepo = new Mock<ILessonRepository>();
        var mockQuestionRepo = new Mock<IInteractiveQuestionRepository>();
        var mockResponseRepo = new Mock<IInteractiveResponseRepository>();

        var lectureService = new LectureService(
            mockChapterRepo.Object,
            mockLessonRepo.Object,
            mockQuestionRepo.Object,
            mockResponseRepo.Object
        );

        var newResponse = new InteractiveResponse
        {
            LessonId = 1,
            QuestionId = 1,
            AppUserId = Guid.NewGuid(),
            SelectedIndex = 2,
            IsCorrect = false
        };

        var createdResponse = new InteractiveResponse
        {
            Id = 1,
            LessonId = newResponse.LessonId,
            QuestionId = newResponse.QuestionId,
            AppUserId = newResponse.AppUserId,
            SelectedIndex = newResponse.SelectedIndex,
            IsCorrect = newResponse.IsCorrect,
            CreatedAt = DateTime.Now
        };

        mockResponseRepo.Setup(x => x.Create(newResponse))
            .Returns(createdResponse);

        // Act
        var result = lectureService.CreateInteractiveResponse(newResponse);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal(2, result.SelectedIndex);
        Assert.False(result.IsCorrect);
        mockResponseRepo.Verify(x => x.Create(newResponse), Times.Once);
    }

    #endregion
}
