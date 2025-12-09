using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class ForumCommentServiceTests
{
    [Fact]
    public async Task GetCommentByIdAsync_ShouldReturnComment_WhenCommentExists()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, null!, null!, null!, null!);

        var comment = new ForumComment { CommentId = 1, Content = "Test Comment" };
        mockCommentRepo.Setup(x => x.GetCommentByIdAsync(1)).ReturnsAsync(comment);

        var result = await service.GetCommentByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal(1, result.CommentId);
    }

    [Fact]
    public async Task GetCommentByIdAsync_ShouldReturnNull_WhenCommentDoesNotExist()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, null!, null!, null!, null!);

        mockCommentRepo.Setup(x => x.GetCommentByIdAsync(999)).ReturnsAsync((ForumComment?)null);

        var result = await service.GetCommentByIdAsync(999);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetCommentsByPostIdAsync_ShouldReturnComments_WhenCommentsExist()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, null!, null!, null!, null!);

        var comments = new List<ForumComment>
        {
            new ForumComment { CommentId = 1, PostId = 1 },
            new ForumComment { CommentId = 2, PostId = 1 }
        };
        mockCommentRepo.Setup(x => x.GetCommentsByPostIdAsync(1, null, null))
            .ReturnsAsync((comments, 2));

        var result = await service.GetCommentsByPostIdAsync(1);

        Assert.Equal(2, result.totalCount);
    }

    [Fact]
    public async Task GetCommentsByPostIdAsync_ShouldReturnEmpty_WhenNoCommentsExist()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, null!, null!, null!, null!);

        mockCommentRepo.Setup(x => x.GetCommentsByPostIdAsync(1, null, null))
            .ReturnsAsync((new List<ForumComment>(), 0));

        var result = await service.GetCommentsByPostIdAsync(1);

        Assert.Equal(0, result.totalCount);
        Assert.Empty(result.comments);
    }

    [Fact]
    public async Task GetModeratorCommentsAsync_ShouldReturnAllComments_WhenCalled()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, null!, null!, null!, null!);

        var comments = new List<ForumComment>
        {
            new ForumComment { CommentId = 1, Status = true },
            new ForumComment { CommentId = 2, Status = null }
        };
        mockCommentRepo.Setup(x => x.GetModeratorCommentsAsync(null, null, null, null, null, null, null))
            .ReturnsAsync((comments, 2));

        var result = await service.GetModeratorCommentsAsync();

        Assert.Equal(2, result.totalCount);
    }

    [Fact]
    public async Task GetModeratorCommentsAsync_ShouldFilterByPostId_WhenPostIdProvided()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, null!, null!, null!, null!);

        var comments = new List<ForumComment>
        {
            new ForumComment { CommentId = 1, PostId = 5, Status = true }
        };
        mockCommentRepo.Setup(x => x.GetModeratorCommentsAsync(5, null, null, null, null, null, null))
            .ReturnsAsync((comments, 1));

        var result = await service.GetModeratorCommentsAsync(5);

        Assert.Single(result.comments);
        Assert.Equal(5, result.comments[0].PostId);
    }

    [Fact]
    public async Task CreateCommentAsync_ShouldCreateComment_WhenNoViolations()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, mockConfigRepo.Object,
            mockModerationRepo.Object, null!, null!);

        var comment = new ForumComment { PostId = 1, Content = "Clean", CreatedBy = Guid.NewGuid(), SchoolId = 1 };
        mockModerationRepo.Setup(x => x.CheckContentViolationAsync("Clean", 1))
            .ReturnsAsync(new List<(int, int, int)>());
        mockCommentRepo.Setup(x => x.CreateCommentAsync(It.IsAny<ForumComment>())).ReturnsAsync(comment);
        mockCommentRepo.Setup(x => x.GetCommentByIdAsync(It.IsAny<int>())).ReturnsAsync(comment);

        var result = await service.CreateCommentAsync(comment);

        Assert.NotNull(result);
        Assert.True(result.Status);
    }

    [Fact]
    public async Task CreateCommentAsync_ShouldRejectAndHide_WhenHasViolations()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, mockConfigRepo.Object,
            mockModerationRepo.Object, null!, null!);

        var comment = new ForumComment { PostId = 1, Content = "Bad", CreatedBy = Guid.NewGuid(), SchoolId = 1 };
        mockModerationRepo.Setup(x => x.CheckContentViolationAsync("Bad", 1))
            .ReturnsAsync(new List<(int, int, int)> { (1, 1, 5) });
        mockCommentRepo.Setup(x => x.CreateCommentAsync(It.IsAny<ForumComment>())).ReturnsAsync(comment);
        mockCommentRepo.Setup(x => x.GetCommentByIdAsync(It.IsAny<int>())).ReturnsAsync(comment);

        var result = await service.CreateCommentAsync(comment);

        Assert.False(result.Status);
        Assert.True(result.IsHidden);
    }

    [Fact]
    public async Task CreateCommentAsync_ShouldIncreaseViolationScore_WhenHasMultipleViolations()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, mockConfigRepo.Object,
            mockModerationRepo.Object, null!, null!);

        var comment = new ForumComment { PostId = 1, Content = "Bad", CreatedBy = Guid.NewGuid(), SchoolId = 1 };
        mockModerationRepo.Setup(x => x.CheckContentViolationAsync("Bad", 1))
            .ReturnsAsync(new List<(int, int, int)> { (1, 1, 5), (2, 2, 3) });
        mockCommentRepo.Setup(x => x.CreateCommentAsync(It.IsAny<ForumComment>())).ReturnsAsync(comment);
        mockCommentRepo.Setup(x => x.GetCommentByIdAsync(It.IsAny<int>())).ReturnsAsync(comment);

        var result = await service.CreateCommentAsync(comment);

        Assert.Equal(8, result.TotalViolationScore);
    }

    [Fact]
    public async Task UpdateCommentAsync_ShouldUpdateComment_WhenValid()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, null!, null!, null!, null!);

        var comment = new ForumComment { CommentId = 1, Content = "Updated" };
        mockCommentRepo.Setup(x => x.UpdateCommentAsync(comment)).ReturnsAsync(comment);

        var result = await service.UpdateCommentAsync(comment);

        Assert.Equal("Updated", result.Content);
    }

    [Fact]
    public async Task SoftDeleteCommentAsync_ShouldDeleteComment_WhenCommentExists()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, null!, null!, null!, null!);

        mockCommentRepo.Setup(x => x.SoftDeleteCommentAsync(1, It.IsAny<Guid>())).ReturnsAsync(true);

        var result = await service.SoftDeleteCommentAsync(1, Guid.NewGuid());

        Assert.True(result);
    }

    [Fact]
    public async Task SoftDeleteCommentAsync_ShouldReturnFalse_WhenCommentDoesNotExist()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, null!, null!, null!, null!);

        mockCommentRepo.Setup(x => x.SoftDeleteCommentAsync(999, It.IsAny<Guid>())).ReturnsAsync(false);

        var result = await service.SoftDeleteCommentAsync(999, Guid.NewGuid());

        Assert.False(result);
    }

    [Fact]
    public async Task ApproveCommentAsync_ShouldApproveComment_WhenCommentExists()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, null!, null!, null!, null!);

        mockCommentRepo.Setup(x => x.ApproveCommentAsync(1, It.IsAny<Guid>())).ReturnsAsync(true);

        var result = await service.ApproveCommentAsync(1, Guid.NewGuid().ToString());

        Assert.True(result);
    }

    [Fact]
    public async Task ApproveCommentAsync_ShouldReturnFalse_WhenCommentDoesNotExist()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, null!, null!, null!, null!);

        mockCommentRepo.Setup(x => x.ApproveCommentAsync(999, It.IsAny<Guid>())).ReturnsAsync(false);

        var result = await service.ApproveCommentAsync(999, Guid.NewGuid().ToString());

        Assert.False(result);
    }

    [Fact]
    public async Task RejectCommentAsync_ShouldRejectComment_WhenCommentExists()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, null!, mockModerationRepo.Object, null!, null!);

        var comment = new ForumComment { CommentId = 1, SchoolId = 1 };
        mockCommentRepo.Setup(x => x.GetCommentByIdAsync(1)).ReturnsAsync(comment);
        mockCommentRepo.Setup(x => x.RejectCommentAsync(1, It.IsAny<Guid>())).ReturnsAsync(true);

        var result = await service.RejectCommentAsync(1, Guid.NewGuid().ToString());

        Assert.True(result);
    }

    [Fact]
    public async Task RejectCommentAsync_ShouldReturnFalse_WhenCommentDoesNotExist()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, null!, mockModerationRepo.Object, null!, null!);

        mockCommentRepo.Setup(x => x.GetCommentByIdAsync(999)).ReturnsAsync((ForumComment?)null);

        var result = await service.RejectCommentAsync(999, Guid.NewGuid().ToString());

        Assert.False(result);
    }

    [Fact]
    public async Task ReportCommentAsync_ShouldCreateReport_WhenValid()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, null!, mockModerationRepo.Object, null!, null!);

        var comment = new ForumComment { CommentId = 1, SchoolId = 1 };
        mockCommentRepo.Setup(x => x.GetCommentByIdAsync(1)).ReturnsAsync(comment);
        mockModerationRepo.Setup(x => x.GetRuleByIdAsync(1)).ReturnsAsync(new ForumRule { Id = 1 });

        var result = await service.ReportCommentAsync(1, Guid.NewGuid(), 1, "Spam");

        Assert.True(result);
    }

    [Fact]
    public async Task ReportCommentAsync_ShouldReturnFalse_WhenCommentDoesNotExist()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, null!, mockModerationRepo.Object, null!, null!);

        mockCommentRepo.Setup(x => x.GetCommentByIdAsync(999)).ReturnsAsync((ForumComment?)null);

        var result = await service.ReportCommentAsync(999, Guid.NewGuid(), 1, "Spam");

        Assert.False(result);
    }

    [Fact]
    public async Task HideCommentByModeratorAsync_ShouldHideComment_WhenValid()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, mockConfigRepo.Object,
            mockModerationRepo.Object, null!, null!);

        var comment = new ForumComment { CommentId = 1, SchoolId = 1 };
        mockCommentRepo.Setup(x => x.GetCommentByIdAsync(1)).ReturnsAsync(comment);
        mockConfigRepo.Setup(x => x.GetAttachmentsByCommentIdAsync(1)).ReturnsAsync(new List<ForumAttachment>());

        var result = await service.HideCommentByModeratorAsync(1, Guid.NewGuid(), 10);

        Assert.True(result);
    }

    [Fact]
    public async Task HideCommentByModeratorAsync_ShouldReturnFalse_WhenCommentDoesNotExist()
    {
        var mockCommentRepo = new Mock<IForumCommentRepository>();
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumCommentService(mockCommentRepo.Object, mockConfigRepo.Object,
            mockModerationRepo.Object, null!, null!);

        mockCommentRepo.Setup(x => x.GetCommentByIdAsync(999)).ReturnsAsync((ForumComment?)null);

        var result = await service.HideCommentByModeratorAsync(999, Guid.NewGuid(), 10);

        Assert.False(result);
    }
}