using Microsoft.Extensions.Configuration;
using Moq;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Domain.Entities.Notifications;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Repositories.Notifications;
using StudyHub.Backend.UseCases.Services;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class ClassNotificationServiceTests
{
    // ✅ Helper: Tạo EmailService thật với mock config
    private SmtpEmailService CreateEmailService()
    {
        var mockConfig = new Mock<IConfiguration>();

        var mockSmtpSection = new Mock<IConfigurationSection>();
        mockSmtpSection.Setup(x => x["Host"]).Returns("smtp.test.com");
        mockSmtpSection.Setup(x => x["Port"]).Returns("587");
        mockSmtpSection.Setup(x => x["User"]).Returns("test@test. com");
        mockSmtpSection.Setup(x => x["Password"]).Returns("password");
        mockSmtpSection.Setup(x => x["From"]).Returns("no-reply@test.com");

        mockConfig.Setup(x => x.GetSection("Smtp")).Returns(mockSmtpSection.Object);
        mockConfig.Setup(x => x["App: BaseUrl"]).Returns("http://localhost:5173");
        mockConfig.Setup(x => x["App:Name"]).Returns("StudyHub");

        return new SmtpEmailService(mockConfig.Object);
    }

    // ✅ Helper: Tạo NotificationService thật với mock repo
    private NotificationService CreateNotificationService()
    {
        var mockNotificationRepo = new Mock<INotificationRepository>();

        // Setup default behaviors nếu cần
        mockNotificationRepo.Setup(x => x.CreateAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Notification n, CancellationToken ct) => n);

        return new NotificationService(mockNotificationRepo.Object);
    }

    #region GetNotifications Tests

    [Fact]
    public void GetNotifications_ShouldReturnNotifications_WhenNotificationsExist()
    {
        // Arrange
        var mockRepo = new Mock<IClassNotificationRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService(); // ✅ Service thật
        var notificationService = CreateNotificationService(); // ✅ Service thật
        var mockNotificationClassRepo = new Mock<INotificationOfClassRepository>();

        var service = new ClassNotificationService(
            mockRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            notificationService,
            mockNotificationClassRepo.Object
        );

        var classId = 1;
        var notifications = new List<ClassNotification>
        {
            new ClassNotification
            {
                Id = 1,
                ClassId = classId,
                Title = "Announcement 1",
                Type = "Announcement"
            },
            new ClassNotification
            {
                Id = 2,
                ClassId = classId,
                Title = "Assignment 1",
                Type = "Assignment"
            }
        };

        mockRepo.Setup(x => x.GetNotifications(classId)).Returns(notifications);

        // Act
        var result = service.GetNotifications(classId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.All(result, n => Assert.Equal(classId, n.ClassId));
        mockRepo.Verify(x => x.GetNotifications(classId), Times.Once);
    }

    [Fact]
    public void GetNotifications_ShouldReturnEmptyList_WhenNoNotificationsExist()
    {
        // Arrange
        var mockRepo = new Mock<IClassNotificationRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();
        var notificationService = CreateNotificationService();
        var mockNotificationClassRepo = new Mock<INotificationOfClassRepository>();

        var service = new ClassNotificationService(
            mockRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            notificationService,
            mockNotificationClassRepo.Object
        );

        var classId = 999;
        mockRepo.Setup(x => x.GetNotifications(classId)).Returns(new List<ClassNotification>());

        // Act
        var result = service.GetNotifications(classId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
        mockRepo.Verify(x => x.GetNotifications(classId), Times.Once);
    }

    #endregion

    [Fact]
    public void CreateNotification_ShouldReturnCreatedNotification_WhenValidDataProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassNotificationRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();
        var notificationService = CreateNotificationService();
        var mockNotificationClassRepo = new Mock<INotificationOfClassRepository>();

        var service = new ClassNotificationService(
            mockRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            notificationService,
            mockNotificationClassRepo.Object
        );

        var creatorId = Guid.NewGuid();
        var deadline = DateTime.Now.AddDays(7);

        var input = new ClassNotification
        {
            ClassId = 1,
            Type = "Classwork",
            Title = "New Announcement",
            Description = "Important announcement",
            Deadline = deadline,
            MaxScore = 10,
            GradeType = "Score",
            AllowSubmission = true,
            InstructionsHtml = "<p>Do homework</p>",
            CreatedBy = creatorId
        };

        var created = new ClassNotification
        {
            Id = 1,
            ClassId = input.ClassId,
            Type = input.Type,
            Title = input.Title,
            Description = input.Description,
            Deadline = input.Deadline,
            MaxScore = input.MaxScore,
            GradeType = input.GradeType,
            AllowSubmission = input.AllowSubmission,
            InstructionsHtml = input.InstructionsHtml,
            CreatedBy = input.CreatedBy,
            CreatedAt = DateTime.Now
        };

        mockRepo.Setup(x => x.CreateNotification(It.IsAny<ClassNotification>()))
            .Returns(created);

        // Act
        var result = service.CreateNotification(input);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal(input.ClassId, result.ClassId);
        Assert.Equal(input.Type, result.Type);
        Assert.Equal(input.Title, result.Title);
        Assert.Equal(input.Description, result.Description);
        Assert.Equal(input.Deadline, result.Deadline);
        Assert.Equal(input.MaxScore, result.MaxScore);
        Assert.Equal(input.GradeType, result.GradeType);
        Assert.Equal(input.AllowSubmission, result.AllowSubmission);
        Assert.Equal(input.InstructionsHtml, result.InstructionsHtml);
        Assert.Equal(input.CreatedBy, result.CreatedBy);
        Assert.NotEqual(default, result.CreatedAt);

        mockRepo.Verify(x => x.CreateNotification(It.IsAny<ClassNotification>()), Times.Once);
    }


    #region GetNotification Tests

    [Fact]
    public void GetNotification_ShouldReturnNotification_WhenNotificationExists()
    {
        // Arrange
        var mockRepo = new Mock<IClassNotificationRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();
        var notificationService = CreateNotificationService();
        var mockNotificationClassRepo = new Mock<INotificationOfClassRepository>();

        var service = new ClassNotificationService(
            mockRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            notificationService,
            mockNotificationClassRepo.Object
        );

        var notificationId = 1;
        var notification = new ClassNotification
        {
            Id = notificationId,
            ClassId = 1,
            Title = "Test Notification",
            Type = "Announcement"
        };

        mockRepo.Setup(x => x.GetNotification(notificationId)).Returns(notification);

        // Act
        var result = service.GetNotification(notificationId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(notificationId, result.Id);
        Assert.Equal("Test Notification", result.Title);
        mockRepo.Verify(x => x.GetNotification(notificationId), Times.Once);
    }

    [Fact]
    public void GetNotification_ShouldReturnNull_WhenNotificationDoesNotExist()
    {
        // Arrange
        var mockRepo = new Mock<IClassNotificationRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();
        var notificationService = CreateNotificationService();
        var mockNotificationClassRepo = new Mock<INotificationOfClassRepository>();

        var service = new ClassNotificationService(
            mockRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            notificationService,
            mockNotificationClassRepo.Object
        );

        var notificationId = 999;
        mockRepo.Setup(x => x.GetNotification(notificationId)).Returns((ClassNotification?)null);

        // Act
        var result = service.GetNotification(notificationId);

        // Assert
        Assert.Null(result);
        mockRepo.Verify(x => x.GetNotification(notificationId), Times.Once);
    }

    #endregion

    [Fact]
    public void EditNotification_ShouldReturnUpdatedNotification_WhenNotificationExists()
    {
        // Arrange
        var mockRepo = new Mock<IClassNotificationRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();
        var notificationService = CreateNotificationService();
        var mockNotificationClassRepo = new Mock<INotificationOfClassRepository>();

        var service = new ClassNotificationService(
            mockRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            notificationService,
            mockNotificationClassRepo.Object
        );

        var updaterId = Guid.NewGuid();
        var deadline = DateTime.Now.AddDays(5);

        var updated = new ClassNotification
        {
            Id = 1,
            ClassId = 1,
            Type = "Classwork",
            Title = "Updated Title",
            Description = "Updated Description",
            Deadline = deadline,
            MaxScore = 20,
            GradeType = "Score",
            AllowSubmission = true,
            InstructionsHtml = "<p>Updated instructions</p>",
            UpdatedBy = updaterId,
            UpdatedAt = DateTime.Now
        };

        mockRepo.Setup(x => x.EditNotification(It.IsAny<ClassNotification>()))
            .Returns(updated);

        // Act
        var result = service.EditNotification(updated);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(updated.Id, result.Id);
        Assert.Equal(updated.Title, result.Title);
        Assert.Equal(updated.Description, result.Description);
        Assert.Equal(updated.Deadline, result.Deadline);
        Assert.Equal(updated.MaxScore, result.MaxScore);
        Assert.Equal(updated.GradeType, result.GradeType);
        Assert.Equal(updated.AllowSubmission, result.AllowSubmission);
        Assert.Equal(updated.InstructionsHtml, result.InstructionsHtml);
        Assert.Equal(updated.UpdatedBy, result.UpdatedBy);
        Assert.NotNull(result.UpdatedAt);

        mockRepo.Verify(x => x.EditNotification(It.IsAny<ClassNotification>()), Times.Once);
    }


    #region DeleteNotification Tests

    [Fact]
    public void DeleteNotification_ShouldReturnTrue_WhenDeletionSuccessful()
    {
        // Arrange
        var mockRepo = new Mock<IClassNotificationRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();
        var notificationService = CreateNotificationService();
        var mockNotificationClassRepo = new Mock<INotificationOfClassRepository>();

        var service = new ClassNotificationService(
            mockRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            notificationService,
            mockNotificationClassRepo.Object
        );

        var notificationId = 1;
        mockRepo.Setup(x => x.DeleteNotification(notificationId)).Returns(true);

        // Act
        var result = service.DeleteNotification(notificationId);

        // Assert
        Assert.True(result);
        mockRepo.Verify(x => x.DeleteNotification(notificationId), Times.Once);
    }

    [Fact]
    public void DeleteNotification_ShouldReturnFalse_WhenNotificationDoesNotExist()
    {
        // Arrange
        var mockRepo = new Mock<IClassNotificationRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();
        var notificationService = CreateNotificationService();
        var mockNotificationClassRepo = new Mock<INotificationOfClassRepository>();

        var service = new ClassNotificationService(
            mockRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            notificationService,
            mockNotificationClassRepo.Object
        );

        var notificationId = 999;
        mockRepo.Setup(x => x.DeleteNotification(notificationId)).Returns(false);

        // Act
        var result = service.DeleteNotification(notificationId);

        // Assert
        Assert.False(result);
        mockRepo.Verify(x => x.DeleteNotification(notificationId), Times.Once);
    }

    #endregion

    #region GetMemberIdsByClass Tests

    [Fact]
    public void GetMemberIdsByClass_ShouldReturnMemberIds_WhenMembersExist()
    {
        // Arrange
        var mockRepo = new Mock<IClassNotificationRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();
        var notificationService = CreateNotificationService();
        var mockNotificationClassRepo = new Mock<INotificationOfClassRepository>();

        var service = new ClassNotificationService(
            mockRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            notificationService,
            mockNotificationClassRepo.Object
        );

        var classId = 1;
        var memberIds = new List<Guid>
        {
            Guid. NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid()
        };

        mockRepo.Setup(x => x.GetMemberIdsByClass(classId)).Returns(memberIds);

        // Act
        var result = service.GetMemberIdsByClass(classId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        mockRepo.Verify(x => x.GetMemberIdsByClass(classId), Times.Once);
    }

    [Fact]
    public void GetMemberIdsByClass_ShouldReturnEmptyList_WhenNoMembersExist()
    {
        // Arrange
        var mockRepo = new Mock<IClassNotificationRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();
        var notificationService = CreateNotificationService();
        var mockNotificationClassRepo = new Mock<INotificationOfClassRepository>();

        var service = new ClassNotificationService(
            mockRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            notificationService,
            mockNotificationClassRepo.Object
        );

        var classId = 999;
        mockRepo.Setup(x => x.GetMemberIdsByClass(classId)).Returns(new List<Guid>());

        // Act
        var result = service.GetMemberIdsByClass(classId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
        mockRepo.Verify(x => x.GetMemberIdsByClass(classId), Times.Once);
    }

    #endregion
}