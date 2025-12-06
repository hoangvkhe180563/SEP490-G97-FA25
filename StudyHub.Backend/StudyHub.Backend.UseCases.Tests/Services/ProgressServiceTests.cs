using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;
using Xunit;

namespace StudyHub.Backend.UseCases.Tests.Services
{
    public class ProgressServiceTests
    {
        private readonly Mock<IProgressRepository> _mockRepo;
        private readonly ProgressService _service;

        public ProgressServiceTests()
        {
            _mockRepo = new Mock<IProgressRepository>();
            _service = new ProgressService(_mockRepo.Object);
        }

        #region GetProgress Tests

        [Fact]
        public void GetProgress_WhenProgressExists_ShouldReturnProgress()
        {
            // Arrange
            var progressId = 1;
            var progress = new CourseProgress
            {
                Id = progressId,
                EnrollmentId = 1,
                LessonId = 1,
                CompletionDate = System.DateTime.UtcNow
            };
            _mockRepo.Setup(r => r.GetProgress(progressId)).Returns(progress);

            // Act
            var result = _service.GetProgress(progressId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(progressId, result.Id);
            Assert.Equal(1, result.EnrollmentId);
            _mockRepo.Verify(r => r.GetProgress(progressId), Times.Once);
        }

        [Fact]
        public void GetProgress_WhenProgressDoesNotExist_ShouldReturnNull()
        {
            // Arrange
            var progressId = 999;
            _mockRepo.Setup(r => r.GetProgress(progressId)).Returns((CourseProgress?)null);

            // Act
            var result = _service.GetProgress(progressId);

            // Assert
            Assert.Null(result);
            _mockRepo.Verify(r => r.GetProgress(progressId), Times.Once);
        }

        #endregion

        #region GetProgressByEnrollmentAndLesson Tests

        [Fact]
        public void GetProgressByEnrollmentAndLesson_WhenProgressExists_ShouldReturnProgress()
        {
            // Arrange
            var enrollmentId = 1;
            var lessonId = 5;
            var progress = new CourseProgress
            {
                Id = 10,
                EnrollmentId = enrollmentId,
                LessonId = lessonId,
                CompletionDate = System.DateTime.UtcNow
            };
            _mockRepo.Setup(r => r.GetProgressByEnrollmentAndLesson(enrollmentId, lessonId))
                     .Returns(progress);

            // Act
            var result = _service.GetProgressByEnrollmentAndLesson(enrollmentId, lessonId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(enrollmentId, result.EnrollmentId);
            Assert.Equal(lessonId, result.LessonId);
            _mockRepo.Verify(r => r.GetProgressByEnrollmentAndLesson(enrollmentId, lessonId), Times.Once);
        }

        [Fact]
        public void GetProgressByEnrollmentAndLesson_WhenProgressDoesNotExist_ShouldReturnNull()
        {
            // Arrange
            var enrollmentId = 1;
            var lessonId = 999;
            _mockRepo.Setup(r => r.GetProgressByEnrollmentAndLesson(enrollmentId, lessonId))
                     .Returns((CourseProgress?)null);

            // Act
            var result = _service.GetProgressByEnrollmentAndLesson(enrollmentId, lessonId);

            // Assert
            Assert.Null(result);
            _mockRepo.Verify(r => r.GetProgressByEnrollmentAndLesson(enrollmentId, lessonId), Times.Once);
        }

        [Fact]
        public void GetProgressByEnrollmentAndLesson_WithDifferentLessons_ShouldReturnCorrectProgress()
        {
            // Arrange
            var enrollmentId = 1;
            var lesson1 = 1;
            var lesson2 = 2;
            var progress1 = new CourseProgress { Id = 1, EnrollmentId = enrollmentId, LessonId = lesson1 };
            var progress2 = new CourseProgress { Id = 2, EnrollmentId = enrollmentId, LessonId = lesson2 };
            _mockRepo.Setup(r => r.GetProgressByEnrollmentAndLesson(enrollmentId, lesson1)).Returns(progress1);
            _mockRepo.Setup(r => r.GetProgressByEnrollmentAndLesson(enrollmentId, lesson2)).Returns(progress2);

            // Act
            var result1 = _service.GetProgressByEnrollmentAndLesson(enrollmentId, lesson1);
            var result2 = _service.GetProgressByEnrollmentAndLesson(enrollmentId, lesson2);

            // Assert
            Assert.NotNull(result1);
            Assert.NotNull(result2);
            Assert.Equal(lesson1, result1.LessonId);
            Assert.Equal(lesson2, result2.LessonId);
        }

        #endregion

        #region CreateProgress Tests

        [Fact]
        public void CreateProgress_ShouldCallRepositoryAndReturnCreatedProgress()
        {
            // Arrange
            var newProgress = new CourseProgress
            {
                EnrollmentId = 1,
                LessonId = 3,
                CompletionDate = System.DateTime.UtcNow
            };
            var createdProgress = new CourseProgress
            {
                Id = 100,
                EnrollmentId = 1,
                LessonId = 3,
                CompletionDate = System.DateTime.UtcNow
            };
            _mockRepo.Setup(r => r.CreateProgress(newProgress)).Returns(createdProgress);

            // Act
            var result = _service.CreateProgress(newProgress);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(100, result.Id);
            Assert.Equal(1, result.EnrollmentId);
            Assert.Equal(3, result.LessonId);
            _mockRepo.Verify(r => r.CreateProgress(newProgress), Times.Once);
        }

        [Fact]
        public void CreateProgress_WithMultipleProgresses_ShouldCreateEach()
        {
            // Arrange
            var progress1 = new CourseProgress { EnrollmentId = 1, LessonId = 1 };
            var progress2 = new CourseProgress { EnrollmentId = 1, LessonId = 2 };
            var created1 = new CourseProgress { Id = 1, EnrollmentId = 1, LessonId = 1 };
            var created2 = new CourseProgress { Id = 2, EnrollmentId = 1, LessonId = 2 };
            _mockRepo.Setup(r => r.CreateProgress(progress1)).Returns(created1);
            _mockRepo.Setup(r => r.CreateProgress(progress2)).Returns(created2);

            // Act
            var result1 = _service.CreateProgress(progress1);
            var result2 = _service.CreateProgress(progress2);

            // Assert
            Assert.NotNull(result1);
            Assert.NotNull(result2);
            Assert.Equal(1, result1.Id);
            Assert.Equal(2, result2.Id);
            _mockRepo.Verify(r => r.CreateProgress(It.IsAny<CourseProgress>()), Times.Exactly(2));
        }

        #endregion

        #region UpdateProgress Tests

        [Fact]
        public void UpdateProgress_ShouldCallRepositoryAndReturnUpdatedProgress()
        {
            // Arrange
            var progressToUpdate = new CourseProgress
            {
                Id = 1,
                EnrollmentId = 1,
                LessonId = 1,
                CompletionDate = System.DateTime.UtcNow
            };
            _mockRepo.Setup(r => r.UpdateProgress(progressToUpdate)).Returns(progressToUpdate);

            // Act
            var result = _service.UpdateProgress(progressToUpdate);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.Id);
            Assert.NotEqual(default(DateTime), result.CompletionDate);
            _mockRepo.Verify(r => r.UpdateProgress(progressToUpdate), Times.Once);
        }

        [Fact]
        public void UpdateProgress_ShouldPreserveProgressId()
        {
            // Arrange
            var originalId = 42;
            var progress = new CourseProgress
            {
                Id = originalId,
                EnrollmentId = 1,
                LessonId = 1,
                CompletionDate = System.DateTime.UtcNow
            };
            _mockRepo.Setup(r => r.UpdateProgress(progress)).Returns(progress);

            // Act
            var result = _service.UpdateProgress(progress);

            // Assert
            Assert.Equal(originalId, result.Id);
            _mockRepo.Verify(r => r.UpdateProgress(progress), Times.Once);
        }

        [Fact]
        public void UpdateProgress_ChangingCompletionDate_ShouldUpdate()
        {
            // Arrange
            var oldDate = System.DateTime.UtcNow.AddDays(-5);
            var newDate = System.DateTime.UtcNow;
            var progress = new CourseProgress
            {
                Id = 1,
                EnrollmentId = 1,
                LessonId = 1,
                CompletionDate = oldDate
            };
            var updatedProgress = new CourseProgress
            {
                Id = 1,
                EnrollmentId = 1,
                LessonId = 1,
                CompletionDate = newDate
            };
            _mockRepo.Setup(r => r.UpdateProgress(It.IsAny<CourseProgress>())).Returns(updatedProgress);

            // Act
            var result = _service.UpdateProgress(progress);

            // Assert
            Assert.Equal(newDate.Date, result.CompletionDate.Date);
        }

        #endregion

        #region DeleteProgress Tests

        [Fact]
        public void DeleteProgress_WhenSuccessful_ShouldReturnTrue()
        {
            // Arrange
            var progressId = 1;
            _mockRepo.Setup(r => r.DeleteProgress(progressId)).Returns(true);

            // Act
            var result = _service.DeleteProgress(progressId);

            // Assert
            Assert.True(result);
            _mockRepo.Verify(r => r.DeleteProgress(progressId), Times.Once);
        }

        [Fact]
        public void DeleteProgress_WhenProgressDoesNotExist_ShouldReturnFalse()
        {
            // Arrange
            var progressId = 999;
            _mockRepo.Setup(r => r.DeleteProgress(progressId)).Returns(false);

            // Act
            var result = _service.DeleteProgress(progressId);

            // Assert
            Assert.False(result);
            _mockRepo.Verify(r => r.DeleteProgress(progressId), Times.Once);
        }

        [Fact]
        public void DeleteProgress_WithMultipleDeletes_ShouldCallRepositoryEachTime()
        {
            // Arrange
            var progressId1 = 1;
            var progressId2 = 2;
            _mockRepo.Setup(r => r.DeleteProgress(progressId1)).Returns(true);
            _mockRepo.Setup(r => r.DeleteProgress(progressId2)).Returns(true);

            // Act
            var result1 = _service.DeleteProgress(progressId1);
            var result2 = _service.DeleteProgress(progressId2);

            // Assert
            Assert.True(result1);
            Assert.True(result2);
            _mockRepo.Verify(r => r.DeleteProgress(It.IsAny<int>()), Times.Exactly(2));
        }

        #endregion

        #region GetProgressesByEnrollment Tests

        [Fact]
        public void GetProgressesByEnrollment_WhenProgressesExist_ShouldReturnList()
        {
            // Arrange
            var enrollmentId = 1;
            var progresses = new List<CourseProgress>
            {
                new CourseProgress { Id = 1, EnrollmentId = enrollmentId, LessonId = 1, CompletionDate = System.DateTime.UtcNow },
                new CourseProgress { Id = 2, EnrollmentId = enrollmentId, LessonId = 2, CompletionDate = System.DateTime.UtcNow },
                new CourseProgress { Id = 3, EnrollmentId = enrollmentId, LessonId = 3, CompletionDate = System.DateTime.UtcNow }
            };
            _mockRepo.Setup(r => r.GetProgressesByEnrollment(enrollmentId)).Returns(progresses);

            // Act
            var result = _service.GetProgressesByEnrollment(enrollmentId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(3, result.Count);
            Assert.All(result, p => Assert.Equal(enrollmentId, p.EnrollmentId));
            _mockRepo.Verify(r => r.GetProgressesByEnrollment(enrollmentId), Times.Once);
        }

        [Fact]
        public void GetProgressesByEnrollment_WhenNoProgresses_ShouldReturnEmptyList()
        {
            // Arrange
            var enrollmentId = 999;
            var progresses = new List<CourseProgress>();
            _mockRepo.Setup(r => r.GetProgressesByEnrollment(enrollmentId)).Returns(progresses);

            // Act
            var result = _service.GetProgressesByEnrollment(enrollmentId);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
            _mockRepo.Verify(r => r.GetProgressesByEnrollment(enrollmentId), Times.Once);
        }

        [Fact]
        public void GetProgressesByEnrollment_WithDifferentEnrollments_ShouldReturnCorrectProgresses()
        {
            // Arrange
            var enrollment1 = 1;
            var enrollment2 = 2;
            var progresses1 = new List<CourseProgress>
            {
                new CourseProgress { Id = 1, EnrollmentId = enrollment1, LessonId = 1 },
                new CourseProgress { Id = 2, EnrollmentId = enrollment1, LessonId = 2 }
            };
            var progresses2 = new List<CourseProgress>
            {
                new CourseProgress { Id = 3, EnrollmentId = enrollment2, LessonId = 1 }
            };
            _mockRepo.Setup(r => r.GetProgressesByEnrollment(enrollment1)).Returns(progresses1);
            _mockRepo.Setup(r => r.GetProgressesByEnrollment(enrollment2)).Returns(progresses2);

            // Act
            var result1 = _service.GetProgressesByEnrollment(enrollment1);
            var result2 = _service.GetProgressesByEnrollment(enrollment2);

            // Assert
            Assert.Equal(2, result1.Count);
            Assert.Single(result2);
            Assert.All(result1, p => Assert.Equal(enrollment1, p.EnrollmentId));
            Assert.All(result2, p => Assert.Equal(enrollment2, p.EnrollmentId));
        }

        [Fact]
        public void GetProgressesByEnrollment_ShouldReturnAllLessonsForEnrollment()
        {
            // Arrange
            var enrollmentId = 1;
            var progresses = new List<CourseProgress>
            {
                new CourseProgress { Id = 1, EnrollmentId = enrollmentId, LessonId = 1, CompletionDate = System.DateTime.UtcNow },
                new CourseProgress { Id = 2, EnrollmentId = enrollmentId, LessonId = 2, CompletionDate = System.DateTime.UtcNow },
                new CourseProgress { Id = 3, EnrollmentId = enrollmentId, LessonId = 3, CompletionDate = System.DateTime.UtcNow },
                new CourseProgress { Id = 4, EnrollmentId = enrollmentId, LessonId = 4, CompletionDate = System.DateTime.UtcNow },
                new CourseProgress { Id = 5, EnrollmentId = enrollmentId, LessonId = 5, CompletionDate = System.DateTime.UtcNow }
            };
            _mockRepo.Setup(r => r.GetProgressesByEnrollment(enrollmentId)).Returns(progresses);

            // Act
            var result = _service.GetProgressesByEnrollment(enrollmentId);

            // Assert
            Assert.Equal(5, result.Count);
            Assert.All(result, p => Assert.NotEqual(default(DateTime), p.CompletionDate));
        }

        #endregion
    }
}
