using Moq;
using StudyHub.Backend.Domain.Entities.Notifications;
using StudyHub.Backend.UseCases.Repositories.Notifications;
using StudyHub.Backend.UseCases.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class NotificationServiceTests
{
    // ✅ Helper: Tạo service với mock repository
    private NotificationService CreateNotificationService()
    {
        var mockRepo = new Mock<INotificationRepository>();

        // Setup default behaviors
        mockRepo.Setup(x => x.CreateAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Notification n, CancellationToken ct) => n);

        mockRepo.Setup(x => x.GetUserRoleIdsAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<Guid>());

        mockRepo.Setup(x => x.GetUserGroupIdsAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<int>());

        return new NotificationService(mockRepo.Object);
    }

    #region SendNotificationAsync Tests

    [Fact]
    public async Task SendNotificationAsync_ShouldCreateNotification_WhenValidDataProvided()
    {
        // Arrange
        var mockRepo = new Mock<INotificationRepository>();
        var service = new NotificationService(mockRepo.Object);

        var notification = new Notification
        {
            Title = "Test Notification",
            Body = "Test Body",
            TargetType = "User",
            TargetUserId = Guid.NewGuid(),
            Priority = "High",
            IsActive = true
        };

        var createdNotification = new Notification
        {
            Id = Guid.NewGuid(),
            Title = notification.Title,
            Body = notification.Body,
            TargetType = notification.TargetType,
            TargetUserId = notification.TargetUserId,
            Priority = notification.Priority,
            IsActive = notification.IsActive,
            CreatedAt = DateTime.Now
        };

        mockRepo.Setup(x => x.CreateAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdNotification);

        // Act
        var result = await service.SendNotificationAsync(notification);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal("Test Notification", result.Title);
        mockRepo.Verify(x => x.CreateAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SendNotificationAsync_ShouldGenerateId_WhenIdIsEmpty()
    {
        // Arrange
        var mockRepo = new Mock<INotificationRepository>();
        var service = new NotificationService(mockRepo.Object);

        var notification = new Notification
        {
            Id = Guid.Empty,
            Title = "Test",
            Body = "Body",
            TargetType = "All"
        };

        mockRepo.Setup(x => x.CreateAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Notification n, CancellationToken ct) => n);

        // Act
        var result = await service.SendNotificationAsync(notification);

        // Assert
        Assert.NotEqual(Guid.Empty, result.Id);
        mockRepo.Verify(x => x.CreateAsync(
            It.Is<Notification>(n => n.Id != Guid.Empty),
            It.IsAny<CancellationToken>()
        ), Times.Once);
    }

    #endregion

    #region GetNotificationByIdAsync Tests

    [Fact]
    public async Task GetNotificationByIdAsync_ShouldReturnNotification_WhenExists()
    {
        // Arrange
        var mockRepo = new Mock<INotificationRepository>();
        var service = new NotificationService(mockRepo.Object);

        var notificationId = Guid.NewGuid();
        var notification = new Notification
        {
            Id = notificationId,
            Title = "Test Notification",
            Body = "Test Body"
        };

        mockRepo.Setup(x => x.GetByIdAsync(notificationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(notification);

        // Act
        var result = await service.GetNotificationByIdAsync(notificationId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(notificationId, result.Id);
        Assert.Equal("Test Notification", result.Title);
        mockRepo.Verify(x => x.GetByIdAsync(notificationId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetNotificationByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        // Arrange
        var mockRepo = new Mock<INotificationRepository>();
        var service = new NotificationService(mockRepo.Object);

        var notificationId = Guid.NewGuid();
        mockRepo.Setup(x => x.GetByIdAsync(notificationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Notification?)null);

        // Act
        var result = await service.GetNotificationByIdAsync(notificationId);

        // Assert
        Assert.Null(result);
        mockRepo.Verify(x => x.GetByIdAsync(notificationId, It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region GetUserNotificationsAsync Tests

    [Fact]
    public async Task GetUserNotificationsAsync_ShouldReturnNotifications_ForUserTargetType()
    {
        // Arrange
        var mockRepo = new Mock<INotificationRepository>();
        var service = new NotificationService(mockRepo.Object);

        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new Notification
            {
                Id = Guid.NewGuid(),
                Title = "User Notification",
                Body = "Body",
                TargetType = "User",
                TargetUserId = userId,
                Priority = "High",
                IsActive = true,
                CreatedAt = DateTime. Now
            }
        };

        mockRepo.Setup(x => x.GetActiveWindowAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(notifications);
        mockRepo.Setup(x => x.GetUserRoleIdsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<Guid>());
        mockRepo.Setup(x => x.GetUserGroupIdsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<int>());
        mockRepo.Setup(x => x.GetReadsForUserAsync(userId, It.IsAny<List<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, NotificationRead>());

        // Act
        var result = await service.GetUserNotificationsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Equal("User Notification", result[0].Notification.Title);
    }

    [Fact]
    public async Task GetUserNotificationsAsync_ShouldReturnNotifications_ForAllTargetType()
    {
        // Arrange
        var mockRepo = new Mock<INotificationRepository>();
        var service = new NotificationService(mockRepo.Object);

        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new Notification
            {
                Id = Guid.NewGuid(),
                Title = "All Notification",
                Body = "Body",
                TargetType = "All",
                Priority = "Normal",
                IsActive = true,
                CreatedAt = DateTime. Now
            }
        };

        mockRepo.Setup(x => x.GetActiveWindowAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(notifications);
        mockRepo.Setup(x => x.GetUserRoleIdsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<Guid>());
        mockRepo.Setup(x => x.GetUserGroupIdsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<int>());
        mockRepo.Setup(x => x.GetReadsForUserAsync(userId, It.IsAny<List<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, NotificationRead>());

        // Act
        var result = await service.GetUserNotificationsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Equal("All Notification", result[0].Notification.Title);
    }

    [Fact]
    public async Task GetUserNotificationsAsync_ShouldExcludeReadNotifications_WhenIncludeReadIsFalse()
    {
        // Arrange
        var mockRepo = new Mock<INotificationRepository>();
        var service = new NotificationService(mockRepo.Object);

        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new Notification
            {
                Id = notificationId,
                Title = "Read Notification",
                Body = "Body",
                TargetType = "User",
                TargetUserId = userId,
                Priority = "Normal",
                IsActive = true,
                CreatedAt = DateTime. Now
            }
        };

        var reads = new Dictionary<Guid, NotificationRead>
        {
            { notificationId, new NotificationRead { NotificationId = notificationId, UserId = userId, IsRead = true } }
        };

        mockRepo.Setup(x => x.GetActiveWindowAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(notifications);
        mockRepo.Setup(x => x.GetUserRoleIdsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<Guid>());
        mockRepo.Setup(x => x.GetUserGroupIdsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<int>());
        mockRepo.Setup(x => x.GetReadsForUserAsync(userId, It.IsAny<List<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(reads);

        // Act
        var result = await service.GetUserNotificationsAsync(userId, includeRead: false);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    #endregion

    #region GetUnreadCountAsync Tests

    [Fact]
    public async Task GetUnreadCountAsync_ShouldReturnCorrectCount_WhenUnreadNotificationsExist()
    {
        // Arrange
        var mockRepo = new Mock<INotificationRepository>();
        var service = new NotificationService(mockRepo.Object);

        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new Notification
            {
                Id = Guid.NewGuid(),
                Title = "Unread 1",
                TargetType = "User",
                TargetUserId = userId,
                IsActive = true,
                CreatedAt = DateTime.Now
            },
            new Notification
            {
                Id = Guid.NewGuid(),
                Title = "Unread 2",
                TargetType = "User",
                TargetUserId = userId,
                IsActive = true,
                CreatedAt = DateTime.Now
            }
        };

        mockRepo.Setup(x => x.GetActiveWindowAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(notifications);
        mockRepo.Setup(x => x.GetUserRoleIdsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<Guid>());
        mockRepo.Setup(x => x.GetUserGroupIdsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<int>());
        mockRepo.Setup(x => x.GetReadsForUserAsync(userId, It.IsAny<List<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, NotificationRead>());

        // Act
        var result = await service.GetUnreadCountAsync(userId);

        // Assert
        Assert.Equal(2, result);
    }

    #endregion

    #region MarkAsReadAsync Tests

    [Fact]
    public async Task MarkAsReadAsync_ShouldCallRepository_WhenCalled()
    {
        // Arrange
        var mockRepo = new Mock<INotificationRepository>();
        var service = new NotificationService(mockRepo.Object);

        var notificationId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        mockRepo.Setup(x => x.UpsertReadAsync(notificationId, userId, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await service.MarkAsReadAsync(notificationId, userId);

        // Assert
        mockRepo.Verify(x => x.UpsertReadAsync(
            notificationId,
            userId,
            It.IsAny<DateTime>(),
            It.IsAny<CancellationToken>()
        ), Times.Once);
    }

    #endregion

    #region MarkAsReadBulkAsync Tests

    [Fact]
    public async Task MarkAsReadBulkAsync_ShouldCallRepository_WhenCalled()
    {
        // Arrange
        var mockRepo = new Mock<INotificationRepository>();
        var service = new NotificationService(mockRepo.Object);

        var notificationIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid() };
        var userId = Guid.NewGuid();

        mockRepo.Setup(x => x.UpsertReadsAsync(
            It.IsAny<IEnumerable<Guid>>(),
            userId,
            It.IsAny<DateTime>(),
            It.IsAny<CancellationToken>()
        )).Returns(Task.CompletedTask);

        // Act
        await service.MarkAsReadBulkAsync(notificationIds, userId);

        // Assert
        mockRepo.Verify(x => x.UpsertReadsAsync(
            It.IsAny<IEnumerable<Guid>>(),
            userId,
            It.IsAny<DateTime>(),
            It.IsAny<CancellationToken>()
        ), Times.Once);
    }

    #endregion

    #region DeactivateNotificationAsync Tests

    [Fact]
    public async Task DeactivateNotificationAsync_ShouldCallRepository_WhenCalled()
    {
        // Arrange
        var mockRepo = new Mock<INotificationRepository>();
        var service = new NotificationService(mockRepo.Object);

        var notificationId = Guid.NewGuid();

        mockRepo.Setup(x => x.DeactivateAsync(notificationId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await service.DeactivateNotificationAsync(notificationId);

        // Assert
        mockRepo.Verify(x => x.DeactivateAsync(notificationId, It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region CreateGroupAsync Tests

    [Fact]
    public async Task CreateGroupAsync_ShouldCreateGroup_WhenValidDataProvided()
    {
        // Arrange
        var mockRepo = new Mock<INotificationRepository>();
        var service = new NotificationService(mockRepo.Object);

        var group = new NotificationGroup
        {
            Name = "Test Group",
            Description = "Test Description",
            CreatedBy = Guid.NewGuid(),
            CreatedAt = DateTime.Now
        };

        var createdGroup = new NotificationGroup
        {
            Id = 1,
            Name = group.Name,
            Description = group.Description,
            CreatedBy = group.CreatedBy,
            CreatedAt = group.CreatedAt
        };

        mockRepo.Setup(x => x.CreateGroupAsync(It.IsAny<NotificationGroup>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdGroup);

        // Act
        var result = await service.CreateGroupAsync(group);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("Test Group", result.Name);
        mockRepo.Verify(x => x.CreateGroupAsync(It.IsAny<NotificationGroup>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region GetGroupByIdAsync Tests

    [Fact]
    public async Task GetGroupByIdAsync_ShouldReturnGroup_WhenExists()
    {
        // Arrange
        var mockRepo = new Mock<INotificationRepository>();
        var service = new NotificationService(mockRepo.Object);

        var groupId = 1;
        var group = new NotificationGroup
        {
            Id = groupId,
            Name = "Test Group",
            Description = "Test Description"
        };

        mockRepo.Setup(x => x.GetGroupByIdAsync(groupId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(group);

        // Act
        var result = await service.GetGroupByIdAsync(groupId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(groupId, result.Id);
        Assert.Equal("Test Group", result.Name);
        mockRepo.Verify(x => x.GetGroupByIdAsync(groupId, It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region GetGroupsForUserAsync Tests

    [Fact]
    public async Task GetGroupsForUserAsync_ShouldReturnGroups_WhenUserBelongsToGroups()
    {
        // Arrange
        var mockRepo = new Mock<INotificationRepository>();
        var service = new NotificationService(mockRepo.Object);

        var userId = Guid.NewGuid();
        var groups = new List<NotificationGroup>
        {
            new NotificationGroup { Id = 1, Name = "Group 1" },
            new NotificationGroup { Id = 2, Name = "Group 2" }
        };

        mockRepo.Setup(x => x.GetGroupsForUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(groups);

        // Act
        var result = await service.GetGroupsForUserAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        mockRepo.Verify(x => x.GetGroupsForUserAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region AddUserToGroupAsync Tests

    [Fact]
    public async Task AddUserToGroupAsync_ShouldCallRepository_WhenCalled()
    {
        // Arrange
        var mockRepo = new Mock<INotificationRepository>();
        var service = new NotificationService(mockRepo.Object);

        var groupId = 1;
        var userId = Guid.NewGuid();

        mockRepo.Setup(x => x.AddUserToGroupAsync(groupId, userId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await service.AddUserToGroupAsync(groupId, userId);

        // Assert
        mockRepo.Verify(x => x.AddUserToGroupAsync(groupId, userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region RemoveUserFromGroupAsync Tests

    [Fact]
    public async Task RemoveUserFromGroupAsync_ShouldCallRepository_WhenCalled()
    {
        // Arrange
        var mockRepo = new Mock<INotificationRepository>();
        var service = new NotificationService(mockRepo.Object);

        var groupId = 1;
        var userId = Guid.NewGuid();

        mockRepo.Setup(x => x.RemoveUserFromGroupAsync(groupId, userId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await service.RemoveUserFromGroupAsync(groupId, userId);

        // Assert
        mockRepo.Verify(x => x.RemoveUserFromGroupAsync(groupId, userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region SeedUnreadAsync Tests

    [Fact]
    public async Task SeedUnreadAsync_ShouldCallRepository_WhenCalled()
    {
        // Arrange
        var mockRepo = new Mock<INotificationRepository>();
        var service = new NotificationService(mockRepo.Object);

        var notificationId = Guid.NewGuid();
        var userIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid() };

        mockRepo.Setup(x => x.SeedUnreadForUsersAsync(
            notificationId,
            It.IsAny<IEnumerable<Guid>>(),
            null,
            It.IsAny<CancellationToken>()
        )).Returns(Task.CompletedTask);

        // Act
        await service.SeedUnreadAsync(notificationId, userIds, null);

        // Assert
        mockRepo.Verify(x => x.SeedUnreadForUsersAsync(
            notificationId,
            It.IsAny<IEnumerable<Guid>>(),
            null,
            It.IsAny<CancellationToken>()
        ), Times.Once);
    }

    #endregion
}