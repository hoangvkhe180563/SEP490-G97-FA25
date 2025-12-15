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

    #region CreateNotification Tests

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

        var notification = new ClassNotification
        {
            ClassId = 1,
            Title = "New Announcement",
            Description = "Important announcement",
            Type = "Announcement",
            CreatedBy = Guid.NewGuid()
        };

        var createdNotification = new ClassNotification
        {
            Id = 1,
            ClassId = 1,
            Title = "New Announcement",
            Description = "Important announcement",
            Type = "Announcement",
            CreatedBy = notification.CreatedBy,
            CreatedAt = DateTime.Now
        };

        mockRepo.Setup(x => x.CreateNotification(It.IsAny<ClassNotification>()))
            .Returns(createdNotification);

        // Act
        var result = service.CreateNotification(notification);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("New Announcement", result.Title);
        mockRepo.Verify(x => x.CreateNotification(It.IsAny<ClassNotification>()), Times.Once);
    }

    #endregion

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

    #region EditNotification Tests

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

        var notification = new ClassNotification
        {
            Id = 1,
            ClassId = 1,
            Title = "Updated Title",
            Description = "Updated Description",
            Type = "Announcement"
        };

        mockRepo.Setup(x => x.EditNotification(It.IsAny<ClassNotification>()))
            .Returns(notification);

        // Act
        var result = service.EditNotification(notification);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Title", result.Title);
        Assert.Equal("Updated Description", result.Description);
        mockRepo.Verify(x => x.EditNotification(It.IsAny<ClassNotification>()), Times.Once);
    }

    #endregion

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