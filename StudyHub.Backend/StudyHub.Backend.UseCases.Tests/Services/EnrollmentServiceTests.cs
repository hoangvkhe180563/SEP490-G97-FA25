using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class EnrollmentServiceTests
{
    #region GetEnrollment Tests

    [Fact]
    public void GetEnrollment_ShouldReturnEnrollment_WhenEnrollmentExists()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var enrollmentId = 1;
        var enrollment = new Enrollment
        {
            Id = enrollmentId,
            AppUserId = Guid.NewGuid(),
            CourseId = 1,
            EnrollmentDate = DateTime.Now
        };

        mockRepo.Setup(x => x.GetEnrollment(enrollmentId))
            .Returns(enrollment);

        // Act
        var result = enrollmentService.GetEnrollment(enrollmentId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(enrollmentId, result.Id);
        Assert.Equal(1, result.CourseId);
        mockRepo.Verify(x => x.GetEnrollment(enrollmentId), Times.Once);
    }

    [Fact]
    public void GetEnrollment_ShouldReturnNull_WhenEnrollmentDoesNotExist()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var enrollmentId = 999;
        mockRepo.Setup(x => x.GetEnrollment(enrollmentId))
            .Returns((Enrollment?)null);

        // Act
        var result = enrollmentService.GetEnrollment(enrollmentId);

        // Assert
        Assert.Null(result);
        mockRepo.Verify(x => x.GetEnrollment(enrollmentId), Times.Once);
    }

    #endregion

    #region GetEnrollmentByUserAndCourse Tests

    [Fact]
    public void GetEnrollmentByUserAndCourse_ShouldReturnEnrollment_WhenEnrollmentExists()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var userId = Guid.NewGuid();
        var courseId = 1;
        var enrollment = new Enrollment
        {
            Id = 1,
            AppUserId = userId,
            CourseId = courseId,
            EnrollmentDate = DateTime.Now
        };

        mockRepo.Setup(x => x.GetEnrollmentByUserAndCourse(userId, courseId))
            .Returns(enrollment);

        // Act
        var result = enrollmentService.GetEnrollmentByUserAndCourse(userId, courseId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.AppUserId);
        Assert.Equal(courseId, result.CourseId);
        mockRepo.Verify(x => x.GetEnrollmentByUserAndCourse(userId, courseId), Times.Once);
    }

    [Fact]
    public void GetEnrollmentByUserAndCourse_ShouldReturnNull_WhenEnrollmentDoesNotExist()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var userId = Guid.NewGuid();
        var courseId = 999;

        mockRepo.Setup(x => x.GetEnrollmentByUserAndCourse(userId, courseId))
            .Returns((Enrollment?)null);

        // Act
        var result = enrollmentService.GetEnrollmentByUserAndCourse(userId, courseId);

        // Assert
        Assert.Null(result);
        mockRepo.Verify(x => x.GetEnrollmentByUserAndCourse(userId, courseId), Times.Once);
    }

    [Fact]
    public void GetEnrollmentByUserAndCourse_ShouldHandleDifferentUsers_WhenCalled()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();
        var courseId = 1;

        var enrollment1 = new Enrollment
        {
            Id = 1,
            AppUserId = userId1,
            CourseId = courseId,
            EnrollmentDate = DateTime.Now
        };

        mockRepo.Setup(x => x.GetEnrollmentByUserAndCourse(userId1, courseId))
            .Returns(enrollment1);
        mockRepo.Setup(x => x.GetEnrollmentByUserAndCourse(userId2, courseId))
            .Returns((Enrollment?)null);

        // Act
        var result1 = enrollmentService.GetEnrollmentByUserAndCourse(userId1, courseId);
        var result2 = enrollmentService.GetEnrollmentByUserAndCourse(userId2, courseId);

        // Assert
        Assert.NotNull(result1);
        Assert.Equal(userId1, result1.AppUserId);
        Assert.Null(result2);
    }

    #endregion

    #region CreateEnrollment Tests

    [Fact]
    public void CreateEnrollment_ShouldCreateAndReturnEnrollment_WhenValidDataProvided()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var newEnrollment = new Enrollment
        {
            AppUserId = Guid.NewGuid(),
            CourseId = 1,
            EnrollmentDate = DateTime.Now
        };

        var createdEnrollment = new Enrollment
        {
            Id = 1,
            AppUserId = newEnrollment.AppUserId,
            CourseId = newEnrollment.CourseId,
            EnrollmentDate = newEnrollment.EnrollmentDate
        };

        mockRepo.Setup(x => x.CreateEnrollment(newEnrollment))
            .Returns(createdEnrollment);

        // Act
        var result = enrollmentService.CreateEnrollment(newEnrollment);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal(newEnrollment.AppUserId, result.AppUserId);
        Assert.Equal(newEnrollment.CourseId, result.CourseId);
        mockRepo.Verify(x => x.CreateEnrollment(newEnrollment), Times.Once);
    }

    [Fact]
    public void CreateEnrollment_ShouldHandleMultipleEnrollments_WhenCalled()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var userId = Guid.NewGuid();
        var enrollment1 = new Enrollment
        {
            AppUserId = userId,
            CourseId = 1,
            EnrollmentDate = DateTime.Now
        };
        var enrollment2 = new Enrollment
        {
            AppUserId = userId,
            CourseId = 2,
            EnrollmentDate = DateTime.Now
        };

        mockRepo.Setup(x => x.CreateEnrollment(It.IsAny<Enrollment>()))
            .Returns((Enrollment e) => new Enrollment
            {
                Id = 1,
                AppUserId = e.AppUserId,
                CourseId = e.CourseId,
                EnrollmentDate = e.EnrollmentDate
            });

        // Act
        var result1 = enrollmentService.CreateEnrollment(enrollment1);
        var result2 = enrollmentService.CreateEnrollment(enrollment2);

        // Assert
        Assert.NotNull(result1);
        Assert.NotNull(result2);
        Assert.Equal(1, result1.CourseId);
        Assert.Equal(2, result2.CourseId);
        mockRepo.Verify(x => x.CreateEnrollment(It.IsAny<Enrollment>()), Times.Exactly(2));
    }

    #endregion

    #region DeleteEnrollment Tests

    [Fact]
    public void DeleteEnrollment_ShouldReturnTrue_WhenEnrollmentDeletedSuccessfully()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var enrollmentId = 1;
        mockRepo.Setup(x => x.DeleteEnrollment(enrollmentId))
            .Returns(true);

        // Act
        var result = enrollmentService.DeleteEnrollment(enrollmentId);

        // Assert
        Assert.True(result);
        mockRepo.Verify(x => x.DeleteEnrollment(enrollmentId), Times.Once);
    }

    [Fact]
    public void DeleteEnrollment_ShouldReturnFalse_WhenEnrollmentDeletionFails()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var enrollmentId = 999;
        mockRepo.Setup(x => x.DeleteEnrollment(enrollmentId))
            .Returns(false);

        // Act
        var result = enrollmentService.DeleteEnrollment(enrollmentId);

        // Assert
        Assert.False(result);
        mockRepo.Verify(x => x.DeleteEnrollment(enrollmentId), Times.Once);
    }

    #endregion

    #region GetEnrollmentsByCourse Tests

    [Fact]
    public void GetEnrollmentsByCourse_ShouldReturnEnrollments_WhenEnrollmentsExist()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var courseId = 1;
        var enrollments = new List<Enrollment>
        {
            new Enrollment
            {
                Id = 1,
                AppUserId = Guid.NewGuid(),
                CourseId = courseId,
                EnrollmentDate = DateTime.Now.AddDays(-10)
            },
            new Enrollment
            {
                Id = 2,
                AppUserId = Guid.NewGuid(),
                CourseId = courseId,
                EnrollmentDate = DateTime.Now.AddDays(-5)
            },
            new Enrollment
            {
                Id = 3,
                AppUserId = Guid.NewGuid(),
                CourseId = courseId,
                EnrollmentDate = DateTime.Now
            }
        };

        mockRepo.Setup(x => x.GetEnrollmentsByCourse(courseId))
            .Returns(enrollments);

        // Act
        var result = enrollmentService.GetEnrollmentsByCourse(courseId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.All(result, e => Assert.Equal(courseId, e.CourseId));
        mockRepo.Verify(x => x.GetEnrollmentsByCourse(courseId), Times.Once);
    }

    [Fact]
    public void GetEnrollmentsByCourse_ShouldReturnEmptyList_WhenNoEnrollmentsExist()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var courseId = 999;
        mockRepo.Setup(x => x.GetEnrollmentsByCourse(courseId))
            .Returns(new List<Enrollment>());

        // Act
        var result = enrollmentService.GetEnrollmentsByCourse(courseId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
        mockRepo.Verify(x => x.GetEnrollmentsByCourse(courseId), Times.Once);
    }

    #endregion

    #region GetEnrollmentsByUser Tests

    [Fact]
    public void GetEnrollmentsByUser_ShouldReturnEnrollments_WhenEnrollmentsExist()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var userId = Guid.NewGuid();
        var enrollments = new List<Enrollment>
        {
            new Enrollment
            {
                Id = 1,
                AppUserId = userId,
                CourseId = 1,
                EnrollmentDate = DateTime.Now.AddDays(-20)
            },
            new Enrollment
            {
                Id = 2,
                AppUserId = userId,
                CourseId = 2,
                EnrollmentDate = DateTime.Now.AddDays(-15)
            },
            new Enrollment
            {
                Id = 3,
                AppUserId = userId,
                CourseId = 3,
                EnrollmentDate = DateTime.Now.AddDays(-10)
            }
        };

        mockRepo.Setup(x => x.GetEnrollmentsByUser(userId))
            .Returns(enrollments);

        // Act
        var result = enrollmentService.GetEnrollmentsByUser(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.All(result, e => Assert.Equal(userId, e.AppUserId));
        mockRepo.Verify(x => x.GetEnrollmentsByUser(userId), Times.Once);
    }

    [Fact]
    public void GetEnrollmentsByUser_ShouldReturnEmptyList_WhenNoEnrollmentsExist()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var userId = Guid.NewGuid();
        mockRepo.Setup(x => x.GetEnrollmentsByUser(userId))
            .Returns(new List<Enrollment>());

        // Act
        var result = enrollmentService.GetEnrollmentsByUser(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
        mockRepo.Verify(x => x.GetEnrollmentsByUser(userId), Times.Once);
    }

    [Fact]
    public void GetEnrollmentsByUser_ShouldReturnOnlyUserEnrollments_WhenMultipleUsersExist()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var userId = Guid.NewGuid();
        var enrollments = new List<Enrollment>
        {
            new Enrollment
            {
                Id = 1,
                AppUserId = userId,
                CourseId = 1,
                EnrollmentDate = DateTime.Now
            },
            new Enrollment
            {
                Id = 2,
                AppUserId = userId,
                CourseId = 2,
                EnrollmentDate = DateTime.Now
            }
        };

        mockRepo.Setup(x => x.GetEnrollmentsByUser(userId))
            .Returns(enrollments);

        // Act
        var result = enrollmentService.GetEnrollmentsByUser(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.All(result, e => Assert.Equal(userId, e.AppUserId));
    }

    #endregion

    #region GetEnrollmentCounts Tests

    [Fact]
    public void GetEnrollmentCounts_ShouldReturnCounts_WhenEnrollmentsExist()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var from = DateTime.Now.AddMonths(-1);
        var to = DateTime.Now;
        int? schoolId = null;

        var enrollmentCounts = new List<KeyValuePair<int, int>>
        {
            new KeyValuePair<int, int>(1, 15),  // Course 1: 15 enrollments
            new KeyValuePair<int, int>(2, 20),  // Course 2: 20 enrollments
            new KeyValuePair<int, int>(3, 10)   // Course 3: 10 enrollments
        };

        mockRepo.Setup(x => x.GetEnrollmentCounts(from, to, schoolId))
            .Returns(enrollmentCounts);

        // Act
        var result = enrollmentService.GetEnrollmentCounts(from, to, schoolId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.Equal(15, result[0].Value);
        Assert.Equal(20, result[1].Value);
        Assert.Equal(10, result[2].Value);
        mockRepo.Verify(x => x.GetEnrollmentCounts(from, to, schoolId), Times.Once);
    }

    [Fact]
    public void GetEnrollmentCounts_ShouldReturnEmptyList_WhenNoEnrollmentsExist()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var from = DateTime.Now.AddMonths(-1);
        var to = DateTime.Now;
        int? schoolId = null;

        mockRepo.Setup(x => x.GetEnrollmentCounts(from, to, schoolId))
            .Returns(new List<KeyValuePair<int, int>>());

        // Act
        var result = enrollmentService.GetEnrollmentCounts(from, to, schoolId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
        mockRepo.Verify(x => x.GetEnrollmentCounts(from, to, schoolId), Times.Once);
    }

    [Fact]
    public void GetEnrollmentCounts_ShouldFilterBySchool_WhenSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var from = DateTime.Now.AddMonths(-1);
        var to = DateTime.Now;
        int? schoolId = 1;

        var enrollmentCounts = new List<KeyValuePair<int, int>>
        {
            new KeyValuePair<int, int>(1, 25),  // Course 1 from school 1: 25 enrollments
            new KeyValuePair<int, int>(3, 30)   // Course 3 from school 1: 30 enrollments
        };

        mockRepo.Setup(x => x.GetEnrollmentCounts(from, to, schoolId))
            .Returns(enrollmentCounts);

        // Act
        var result = enrollmentService.GetEnrollmentCounts(from, to, schoolId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        mockRepo.Verify(x => x.GetEnrollmentCounts(from, to, schoolId), Times.Once);
    }

    [Fact]
    public void GetEnrollmentCounts_ShouldHandleNullDateRange_WhenCalled()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        DateTime? from = null;
        DateTime? to = null;
        int? schoolId = null;

        var enrollmentCounts = new List<KeyValuePair<int, int>>
        {
            new KeyValuePair<int, int>(1, 100),
            new KeyValuePair<int, int>(2, 150)
        };

        mockRepo.Setup(x => x.GetEnrollmentCounts(from, to, schoolId))
            .Returns(enrollmentCounts);

        // Act
        var result = enrollmentService.GetEnrollmentCounts(from, to, schoolId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal(100, result[0].Value);
        Assert.Equal(150, result[1].Value);
        mockRepo.Verify(x => x.GetEnrollmentCounts(from, to, schoolId), Times.Once);
    }

    [Fact]
    public void GetEnrollmentCounts_ShouldFilterByDateRange_WhenDatesProvided()
    {
        // Arrange
        var mockRepo = new Mock<IEnrollmentRepository>();
        var enrollmentService = new EnrollmentService(mockRepo.Object);

        var from = new DateTime(2024, 1, 1);
        var to = new DateTime(2024, 12, 31);
        int? schoolId = null;

        var enrollmentCounts = new List<KeyValuePair<int, int>>
        {
            new KeyValuePair<int, int>(1, 50),
            new KeyValuePair<int, int>(2, 75),
            new KeyValuePair<int, int>(3, 60)
        };

        mockRepo.Setup(x => x.GetEnrollmentCounts(from, to, schoolId))
            .Returns(enrollmentCounts);

        // Act
        var result = enrollmentService.GetEnrollmentCounts(from, to, schoolId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.Equal(50, result[0].Value);
        Assert.Equal(75, result[1].Value);
        Assert.Equal(60, result[2].Value);
        mockRepo.Verify(x => x.GetEnrollmentCounts(from, to, schoolId), Times.Once);
    }

    #endregion
}
