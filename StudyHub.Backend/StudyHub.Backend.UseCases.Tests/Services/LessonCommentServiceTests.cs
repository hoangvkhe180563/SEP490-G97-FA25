using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class LessonCommentServiceTests
{
    #region GetCommentsByLessonId Tests

    [Fact]
    public void GetCommentsByLessonId_ShouldReturnComments_WhenCommentsExist()
    {
        // Arrange
        var mockRepo = new Mock<ILessonRepository>();
        var service = new LessonCommentService(mockRepo.Object);

        var lessonId = 1;
        var comments = new List<LessonComment>
        {
            new LessonComment
            {
                Id = 1,
                LessonId = lessonId,
                AppUserId = Guid.NewGuid(),
                Content = "Great lesson!",
                CreatedAt = DateTime.Now.AddDays(-2)
            },
            new LessonComment
            {
                Id = 2,
                LessonId = lessonId,
                AppUserId = Guid.NewGuid(),
                Content = "Very helpful!",
                CreatedAt = DateTime.Now.AddDays(-1)
            },
            new LessonComment
            {
                Id = 3,
                LessonId = lessonId,
                AppUserId = Guid.NewGuid(),
                Content = "Thanks for this!",
                CreatedAt = DateTime.Now
            }
        };

        mockRepo.Setup(x => x.GetCommentsByLessonId(lessonId))
            .Returns(comments);

        // Act
        var result = service.GetCommentsByLessonId(lessonId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.All(result, c => Assert.Equal(lessonId, c.LessonId));
        mockRepo.Verify(x => x.GetCommentsByLessonId(lessonId), Times.Once);
    }

    [Fact]
    public void GetCommentsByLessonId_ShouldReturnEmptyList_WhenNoCommentsExist()
    {
        // Arrange
        var mockRepo = new Mock<ILessonRepository>();
        var service = new LessonCommentService(mockRepo.Object);

        var lessonId = 999;
        mockRepo.Setup(x => x.GetCommentsByLessonId(lessonId))
            .Returns(new List<LessonComment>());

        // Act
        var result = service.GetCommentsByLessonId(lessonId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
        mockRepo.Verify(x => x.GetCommentsByLessonId(lessonId), Times.Once);
    }

    [Fact]
    public void GetCommentsByLessonId_ShouldReturnCommentsInOrder_WhenMultipleCommentsExist()
    {
        // Arrange
        var mockRepo = new Mock<ILessonRepository>();
        var service = new LessonCommentService(mockRepo.Object);

        var lessonId = 1;
        var comments = new List<LessonComment>
        {
            new LessonComment
            {
                Id = 1,
                LessonId = lessonId,
                AppUserId = Guid.NewGuid(),
                Content = "First comment",
                CreatedAt = DateTime.Now.AddDays(-3)
            },
            new LessonComment
            {
                Id = 2,
                LessonId = lessonId,
                AppUserId = Guid.NewGuid(),
                Content = "Second comment",
                CreatedAt = DateTime.Now.AddDays(-2)
            }
        };

        mockRepo.Setup(x => x.GetCommentsByLessonId(lessonId))
            .Returns(comments);

        // Act
        var result = service.GetCommentsByLessonId(lessonId);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal("First comment", result[0].Content);
        Assert.Equal("Second comment", result[1].Content);
    }

    #endregion

    #region GetCommentById Tests

    [Fact]
    public void GetCommentById_ShouldReturnComment_WhenCommentExists()
    {
        // Arrange
        var mockRepo = new Mock<ILessonRepository>();
        var service = new LessonCommentService(mockRepo.Object);

        var commentId = 1;
        var comment = new LessonComment
        {
            Id = commentId,
            LessonId = 1,
            AppUserId = Guid.NewGuid(),
            Content = "Test comment",
            CreatedAt = DateTime.Now
        };

        mockRepo.Setup(x => x.GetCommentById(commentId))
            .Returns(comment);

        // Act
        var result = service.GetCommentById(commentId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(commentId, result.Id);
        Assert.Equal("Test comment", result.Content);
        mockRepo.Verify(x => x.GetCommentById(commentId), Times.Once);
    }

    [Fact]
    public void GetCommentById_ShouldReturnNull_WhenCommentDoesNotExist()
    {
        // Arrange
        var mockRepo = new Mock<ILessonRepository>();
        var service = new LessonCommentService(mockRepo.Object);

        var commentId = 999;
        mockRepo.Setup(x => x.GetCommentById(commentId))
            .Returns((LessonComment?)null);

        // Act
        var result = service.GetCommentById(commentId);

        // Assert
        Assert.Null(result);
        mockRepo.Verify(x => x.GetCommentById(commentId), Times.Once);
    }

    #endregion

    #region CreateComment Tests

    [Fact]
    public void CreateComment_ShouldCreateAndReturnComment_WhenValidDataProvided()
    {
        // Arrange
        var mockRepo = new Mock<ILessonRepository>();
        var service = new LessonCommentService(mockRepo.Object);

        var newComment = new LessonComment
        {
            LessonId = 1,
            AppUserId = Guid.NewGuid(),
            Content = "New comment"
        };

        var createdComment = new LessonComment
        {
            Id = 1,
            LessonId = newComment.LessonId,
            AppUserId = newComment.AppUserId,
            Content = newComment.Content,
            CreatedAt = DateTime.Now
        };

        mockRepo.Setup(x => x.CreateComment(newComment))
            .Returns(createdComment);

        // Act
        var result = service.CreateComment(newComment);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("New comment", result.Content);
        mockRepo.Verify(x => x.CreateComment(newComment), Times.Once);
    }

    [Fact]
    public void CreateComment_ShouldHandleMultipleComments_WhenCalled()
    {
        // Arrange
        var mockRepo = new Mock<ILessonRepository>();
        var service = new LessonCommentService(mockRepo.Object);

        var userId = Guid.NewGuid();
        var lessonId = 1;

        var comment1 = new LessonComment
        {
            LessonId = lessonId,
            AppUserId = userId,
            Content = "First comment"
        };

        var comment2 = new LessonComment
        {
            LessonId = lessonId,
            AppUserId = userId,
            Content = "Second comment"
        };

        mockRepo.Setup(x => x.CreateComment(It.IsAny<LessonComment>()))
            .Returns((LessonComment c) => new LessonComment
            {
                Id = 1,
                LessonId = c.LessonId,
                AppUserId = c.AppUserId,
                Content = c.Content,
                CreatedAt = DateTime.Now
            });

        // Act
        var result1 = service.CreateComment(comment1);
        var result2 = service.CreateComment(comment2);

        // Assert
        Assert.NotNull(result1);
        Assert.NotNull(result2);
        Assert.Equal("First comment", result1.Content);
        Assert.Equal("Second comment", result2.Content);
        mockRepo.Verify(x => x.CreateComment(It.IsAny<LessonComment>()), Times.Exactly(2));
    }

    #endregion

    #region UpdateComment Tests

    [Fact]
    public void UpdateComment_ShouldUpdateAndReturnComment_WhenValidDataProvided()
    {
        // Arrange
        var mockRepo = new Mock<ILessonRepository>();
        var service = new LessonCommentService(mockRepo.Object);

        var updatedComment = new LessonComment
        {
            Id = 1,
            LessonId = 1,
            AppUserId = Guid.NewGuid(),
            Content = "Updated comment",
            UpdatedAt = DateTime.Now
        };

        mockRepo.Setup(x => x.UpdateComment(updatedComment))
            .Returns(updatedComment);

        // Act
        var result = service.UpdateComment(updatedComment);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated comment", result.Content);
        Assert.NotNull(result.UpdatedAt);
        mockRepo.Verify(x => x.UpdateComment(updatedComment), Times.Once);
    }

    [Fact]
    public void UpdateComment_ShouldPreserveCommentId_WhenUpdating()
    {
        // Arrange
        var mockRepo = new Mock<ILessonRepository>();
        var service = new LessonCommentService(mockRepo.Object);

        var commentId = 5;
        var updatedComment = new LessonComment
        {
            Id = commentId,
            LessonId = 1,
            AppUserId = Guid.NewGuid(),
            Content = "Updated content"
        };

        mockRepo.Setup(x => x.UpdateComment(updatedComment))
            .Returns(updatedComment);

        // Act
        var result = service.UpdateComment(updatedComment);

        // Assert
        Assert.Equal(commentId, result.Id);
        Assert.Equal("Updated content", result.Content);
    }

    #endregion

    #region DeleteComment Tests

    [Fact]
    public void DeleteComment_ShouldReturnTrue_WhenCommentDeletedSuccessfully()
    {
        // Arrange
        var mockRepo = new Mock<ILessonRepository>();
        var service = new LessonCommentService(mockRepo.Object);

        var commentId = 1;
        var userId = Guid.NewGuid();

        mockRepo.Setup(x => x.DeleteComment(commentId, userId))
            .Returns(true);

        // Act
        var result = service.DeleteComment(commentId, userId);

        // Assert
        Assert.True(result);
        mockRepo.Verify(x => x.DeleteComment(commentId, userId), Times.Once);
    }

    [Fact]
    public void DeleteComment_ShouldReturnFalse_WhenCommentDeletionFails()
    {
        // Arrange
        var mockRepo = new Mock<ILessonRepository>();
        var service = new LessonCommentService(mockRepo.Object);

        var commentId = 999;
        var userId = Guid.NewGuid();

        mockRepo.Setup(x => x.DeleteComment(commentId, userId))
            .Returns(false);

        // Act
        var result = service.DeleteComment(commentId, userId);

        // Assert
        Assert.False(result);
        mockRepo.Verify(x => x.DeleteComment(commentId, userId), Times.Once);
    }

    [Fact]
    public void DeleteComment_ShouldReturnFalse_WhenUserIsNotOwner()
    {
        // Arrange
        var mockRepo = new Mock<ILessonRepository>();
        var service = new LessonCommentService(mockRepo.Object);

        var commentId = 1;
        var wrongUserId = Guid.NewGuid();

        mockRepo.Setup(x => x.DeleteComment(commentId, wrongUserId))
            .Returns(false);

        // Act
        var result = service.DeleteComment(commentId, wrongUserId);

        // Assert
        Assert.False(result);
        mockRepo.Verify(x => x.DeleteComment(commentId, wrongUserId), Times.Once);
    }

    [Fact]
    public void DeleteComment_ShouldHandleDifferentUsers_WhenCalled()
    {
        // Arrange
        var mockRepo = new Mock<ILessonRepository>();
        var service = new LessonCommentService(mockRepo.Object);

        var commentId = 1;
        var ownerId = Guid.NewGuid();
        var otherId = Guid.NewGuid();

        mockRepo.Setup(x => x.DeleteComment(commentId, ownerId))
            .Returns(true);
        mockRepo.Setup(x => x.DeleteComment(commentId, otherId))
            .Returns(false);

        // Act
        var ownerResult = service.DeleteComment(commentId, ownerId);
        var otherResult = service.DeleteComment(commentId, otherId);

        // Assert
        Assert.True(ownerResult);
        Assert.False(otherResult);
    }

    #endregion
}
