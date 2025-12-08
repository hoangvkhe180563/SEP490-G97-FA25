using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class ForumPostServiceTests
{
    [Fact]
    public async Task GetPostByIdAsync_ShouldReturnPost_WhenPostExists()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockImageModeration = new Mock<IImageModerationService>();
        var mockSignalR = new Mock<ISignalRNotifier>();

        var service = new ForumPostService(mockPostRepo.Object, mockConfigRepo.Object,
            mockModerationRepo.Object, mockFileStorage.Object, mockImageModeration.Object, mockSignalR.Object);

        var post = new ForumPost { Id = 1, Title = "Test Post", SchoolId = 1 };
        mockPostRepo.Setup(x => x.GetPostByIdAsync(1)).ReturnsAsync(post);

        var result = await service.GetPostByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("Test Post", result.Title);
    }

    [Fact]
    public async Task GetPostByIdAsync_ShouldReturnNull_WhenPostDoesNotExist()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var service = new ForumPostService(mockPostRepo.Object, null!, null!, null!, null!, null!);

        mockPostRepo.Setup(x => x.GetPostByIdAsync(999)).ReturnsAsync((ForumPost?)null);

        var result = await service.GetPostByIdAsync(999);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetPublicPostsAsync_ShouldReturnPosts_WhenPostsExist()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var service = new ForumPostService(mockPostRepo.Object, null!, null!, null!, null!, null!);

        var posts = new List<ForumPost>
        {
            new ForumPost { Id = 1, SchoolId = 1, Status = true },
            new ForumPost { Id = 2, SchoolId = 1, Status = true }
        };
        mockPostRepo.Setup(x => x.GetPublicPostsAsync(1, null, null, null, null, null, null))
            .ReturnsAsync((posts, 2));

        var result = await service.GetPublicPostsAsync(1);

        Assert.Equal(2, result.totalCount);
        Assert.Equal(2, result.posts.Count);
    }

    [Fact]
    public async Task GetPublicPostsAsync_ShouldReturnEmptyList_WhenNoPostsExist()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var service = new ForumPostService(mockPostRepo.Object, null!, null!, null!, null!, null!);

        mockPostRepo.Setup(x => x.GetPublicPostsAsync(1, null, null, null, null, null, null))
            .ReturnsAsync((new List<ForumPost>(), 0));

        var result = await service.GetPublicPostsAsync(1);

        Assert.Equal(0, result.totalCount);
        Assert.Empty(result.posts);
    }

    [Fact]
    public async Task GetPublicPostsAsync_ShouldFilterBySubject_WhenSubjectIdsProvided()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var service = new ForumPostService(mockPostRepo.Object, null!, null!, null!, null!, null!);

        var subjectIds = new List<short> { 1 };
        var posts = new List<ForumPost> { new ForumPost { Id = 1, SubjectId = 1, SchoolId = 1 } };
        mockPostRepo.Setup(x => x.GetPublicPostsAsync(1, subjectIds, null, null, null, null, null))
            .ReturnsAsync((posts, 1));

        var result = await service.GetPublicPostsAsync(1, subjectIds);

        Assert.Single(result.posts);
        Assert.Equal(1, result.posts[0].SubjectId);
    }

    [Fact]
    public async Task GetPublicPostsAsync_ShouldFilterByFlairs_WhenFlairIdsProvided()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var service = new ForumPostService(mockPostRepo.Object, null!, null!, null!, null!, null!);

        var flairIds = new List<int> { 1 };
        var posts = new List<ForumPost> { new ForumPost { Id = 1, FlairId = 1, SchoolId = 1 } };
        mockPostRepo.Setup(x => x.GetPublicPostsAsync(1, null, flairIds, null, null, null, null))
            .ReturnsAsync((posts, 1));

        var result = await service.GetPublicPostsAsync(1, null, flairIds);

        Assert.Single(result.posts);
        Assert.Equal(1, result.posts[0].FlairId);
    }

    [Fact]
    public async Task GetPublicPostsAsync_ShouldSearchByQuery_WhenQueryProvided()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var service = new ForumPostService(mockPostRepo.Object, null!, null!, null!, null!, null!);

        var posts = new List<ForumPost> { new ForumPost { Id = 1, Title = "Test Query", SchoolId = 1 } };
        mockPostRepo.Setup(x => x.GetPublicPostsAsync(1, null, null, "Test", null, null, null))
            .ReturnsAsync((posts, 1));

        var result = await service.GetPublicPostsAsync(1, null, null, "Test");

        Assert.Single(result.posts);
        Assert.Contains("Test", result.posts[0].Title);
    }

    [Fact]
    public async Task GetPublicPostsAsync_ShouldSortByDate_WhenSortByDateAsc()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var service = new ForumPostService(mockPostRepo.Object, null!, null!, null!, null!, null!);

        var posts = new List<ForumPost>
        {
            new ForumPost { Id = 1, SchoolId = 1, CreatedAt = DateTime.Now.AddDays(-2) },
            new ForumPost { Id = 2, SchoolId = 1, CreatedAt = DateTime.Now.AddDays(-1) }
        };
        mockPostRepo.Setup(x => x.GetPublicPostsAsync(1, null, null, null, "date_asc", null, null))
            .ReturnsAsync((posts, 2));

        var result = await service.GetPublicPostsAsync(1, null, null, null, "date_asc");

        Assert.Equal(2, result.posts.Count);
    }

    [Fact]
    public async Task GetOwnedPostsAsync_ShouldReturnUserPosts_WhenPostsExist()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var service = new ForumPostService(mockPostRepo.Object, null!, null!, null!, null!, null!);

        var userId = Guid.NewGuid();
        var posts = new List<ForumPost>
        {
            new ForumPost { Id = 1, CreatedBy = userId, SchoolId = 1 },
            new ForumPost { Id = 2, CreatedBy = userId, SchoolId = 1 }
        };
        mockPostRepo.Setup(x => x.GetOwnedPostsAsync(userId, 1, null, null, null, null, null, null, null, null))
            .ReturnsAsync((posts, 2));

        var result = await service.GetOwnedPostsAsync(userId, 1);

        Assert.Equal(2, result.totalCount);
        Assert.All(result.posts, p => Assert.Equal(userId, p.CreatedBy));
    }

    [Fact]
    public async Task GetOwnedPostsAsync_ShouldReturnEmpty_WhenUserHasNoPosts()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var service = new ForumPostService(mockPostRepo.Object, null!, null!, null!, null!, null!);

        var userId = Guid.NewGuid();
        mockPostRepo.Setup(x => x.GetOwnedPostsAsync(userId, 1, null, null, null, null, null, null, null, null))
            .ReturnsAsync((new List<ForumPost>(), 0));

        var result = await service.GetOwnedPostsAsync(userId, 1);

        Assert.Equal(0, result.totalCount);
        Assert.Empty(result.posts);
    }

    [Fact]
    public async Task GetModeratorPostsAsync_ShouldReturnAllPosts_WhenCalled()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var service = new ForumPostService(mockPostRepo.Object, null!, null!, null!, null!, null!);

        var posts = new List<ForumPost>
        {
            new ForumPost { Id = 1, SchoolId = 1, Status = true },
            new ForumPost { Id = 2, SchoolId = 1, Status = null }
        };
        mockPostRepo.Setup(x => x.GetModeratorPostsAsync(1, null, null, null, null, null, null, null, null, null, null, null))
            .ReturnsAsync((posts, 2));

        var result = await service.GetModeratorPostsAsync(1);

        Assert.Equal(2, result.totalCount);
    }

    [Fact]
    public async Task GetModeratorPostsAsync_ShouldFilterByStatus_WhenStatusProvided()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var service = new ForumPostService(mockPostRepo.Object, null!, null!, null!, null!, null!);

        var posts = new List<ForumPost>
        {
            new ForumPost { Id = 1, SchoolId = 1, Status = null }
        };
        mockPostRepo.Setup(x => x.GetModeratorPostsAsync(1, null, null, null, "pending", null, null, null, null, null, null, null))
            .ReturnsAsync((posts, 1));

        var result = await service.GetModeratorPostsAsync(1, null, null, null, "pending");

        Assert.Single(result.posts);
        Assert.Null(result.posts[0].Status);
    }

    [Fact]
    public async Task CreatePostAsync_ShouldCreatePost_WhenNoViolations()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var mockSignalR = new Mock<ISignalRNotifier>();
        var service = new ForumPostService(mockPostRepo.Object, mockConfigRepo.Object,
            mockModerationRepo.Object, null!, null!, mockSignalR.Object);

        var post = new ForumPost { SchoolId = 1, Content = "Clean content", CreatedBy = Guid.NewGuid() };
        mockModerationRepo.Setup(x => x.CheckContentViolationAsync("Clean content", 1))
            .ReturnsAsync(new List<(int, int, int)>());
        mockPostRepo.Setup(x => x.CreatePostAsync(It.IsAny<ForumPost>())).ReturnsAsync(post);
        mockPostRepo.Setup(x => x.GetPostByIdAsync(It.IsAny<int>())).ReturnsAsync(post);

        var result = await service.CreatePostAsync(post);

        Assert.NotNull(result);
        Assert.True(result.Status);
    }

    [Fact]
    public async Task CreatePostAsync_ShouldMarkPending_WhenHasViolationsWithProtectedFlair()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var mockSignalR = new Mock<ISignalRNotifier>();
        var service = new ForumPostService(mockPostRepo.Object, mockConfigRepo.Object,
            mockModerationRepo.Object, null!, null!, mockSignalR.Object);

        var post = new ForumPost { SchoolId = 1, Content = "Bad content", CreatedBy = Guid.NewGuid(), FlairId = 1 };
        var flair = new ForumFlair { Id = 1, IsProtected = true };

        mockConfigRepo.Setup(x => x.GetFlairByIdAsync(1)).ReturnsAsync(flair);
        mockModerationRepo.Setup(x => x.CheckContentViolationAsync("Bad content", 1))
            .ReturnsAsync(new List<(int, int, int)> { (1, 1, 5) });
        mockPostRepo.Setup(x => x.CreatePostAsync(It.IsAny<ForumPost>())).ReturnsAsync(post);
        mockPostRepo.Setup(x => x.GetPostByIdAsync(It.IsAny<int>())).ReturnsAsync(post);

        var result = await service.CreatePostAsync(post);

        Assert.Null(result.Status);
    }

    [Fact]
    public async Task CreatePostAsync_ShouldRejectAndHide_WhenHasViolationsWithoutProtectedFlair()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var mockSignalR = new Mock<ISignalRNotifier>();
        var service = new ForumPostService(mockPostRepo.Object, mockConfigRepo.Object,
            mockModerationRepo.Object, null!, null!, mockSignalR.Object);

        var post = new ForumPost { SchoolId = 1, Content = "Bad content", CreatedBy = Guid.NewGuid() };

        mockModerationRepo.Setup(x => x.CheckContentViolationAsync("Bad content", 1))
            .ReturnsAsync(new List<(int, int, int)> { (1, 1, 5) });
        mockPostRepo.Setup(x => x.CreatePostAsync(It.IsAny<ForumPost>())).ReturnsAsync(post);
        mockPostRepo.Setup(x => x.GetPostByIdAsync(It.IsAny<int>())).ReturnsAsync(post);

        var result = await service.CreatePostAsync(post);

        Assert.False(result.Status);
        Assert.True(result.IsHidden);
    }

    [Fact]
    public async Task UpdatePostAsync_ShouldUpdatePost_WhenValid()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var service = new ForumPostService(mockPostRepo.Object, null!, null!, null!, null!, null!);

        var post = new ForumPost { Id = 1, Title = "Updated" };
        mockPostRepo.Setup(x => x.UpdatePostAsync(post)).ReturnsAsync(post);

        var result = await service.UpdatePostAsync(post);

        Assert.Equal("Updated", result.Title);
    }

    [Fact]
    public async Task SoftDeletePostAsync_ShouldDeletePost_WhenPostExists()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var service = new ForumPostService(mockPostRepo.Object, null!, null!, null!, null!, null!);

        mockPostRepo.Setup(x => x.SoftDeletePostAsync(1, It.IsAny<Guid>())).ReturnsAsync(true);

        var result = await service.SoftDeletePostAsync(1, Guid.NewGuid());

        Assert.True(result);
    }

    [Fact]
    public async Task SoftDeletePostAsync_ShouldReturnFalse_WhenPostDoesNotExist()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var service = new ForumPostService(mockPostRepo.Object, null!, null!, null!, null!, null!);

        mockPostRepo.Setup(x => x.SoftDeletePostAsync(999, It.IsAny<Guid>())).ReturnsAsync(false);

        var result = await service.SoftDeletePostAsync(999, Guid.NewGuid());

        Assert.False(result);
    }

    [Fact]
    public async Task ApprovePostAsync_ShouldApprovePost_WhenPostExists()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumPostService(mockPostRepo.Object, mockConfigRepo.Object, null!, null!, null!, null!);

        var post = new ForumPost { Id = 1, SchoolId = 1 };
        mockPostRepo.Setup(x => x.GetPostByIdAsync(1)).ReturnsAsync(post);
        mockConfigRepo.Setup(x => x.GetAttachmentsByPostIdAsync(1)).ReturnsAsync(new List<ForumAttachment>());
        mockPostRepo.Setup(x => x.ApprovePostAsync(1, It.IsAny<Guid>())).ReturnsAsync(true);

        var result = await service.ApprovePostAsync(1, Guid.NewGuid().ToString());

        Assert.True(result);
    }

    [Fact]
    public async Task ApprovePostAsync_ShouldReturnFalse_WhenPostDoesNotExist()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumPostService(mockPostRepo.Object, mockConfigRepo.Object, null!, null!, null!, null!);

        mockPostRepo.Setup(x => x.GetPostByIdAsync(999)).ReturnsAsync((ForumPost?)null);

        var result = await service.ApprovePostAsync(999, Guid.NewGuid().ToString());

        Assert.False(result);
    }

    [Fact]
    public async Task RejectPostAsync_ShouldRejectPost_WhenPostExists()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumPostService(mockPostRepo.Object, mockConfigRepo.Object,
            mockModerationRepo.Object, null!, null!, null!);

        var post = new ForumPost { Id = 1, SchoolId = 1, TotalViolationScore = 5 };
        mockPostRepo.Setup(x => x.GetPostByIdAsync(1)).ReturnsAsync(post);
        mockConfigRepo.Setup(x => x.GetAttachmentsByPostIdAsync(1)).ReturnsAsync(new List<ForumAttachment>());
        mockPostRepo.Setup(x => x.RejectPostAsync(1, It.IsAny<Guid>())).ReturnsAsync(true);

        var result = await service.RejectPostAsync(1, Guid.NewGuid().ToString());

        Assert.True(result);
    }

    [Fact]
    public async Task RejectPostAsync_ShouldReturnFalse_WhenPostDoesNotExist()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumPostService(mockPostRepo.Object, mockConfigRepo.Object,
            mockModerationRepo.Object, null!, null!, null!);

        mockPostRepo.Setup(x => x.GetPostByIdAsync(999)).ReturnsAsync((ForumPost?)null);

        var result = await service.RejectPostAsync(999, Guid.NewGuid().ToString());

        Assert.False(result);
    }

    [Fact]
    public async Task ReportPostAsync_ShouldCreateReport_WhenValid()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumPostService(mockPostRepo.Object, null!, mockModerationRepo.Object, null!, null!, null!);

        var post = new ForumPost { Id = 1, SchoolId = 1 };
        mockPostRepo.Setup(x => x.GetPostByIdAsync(1)).ReturnsAsync(post);
        mockModerationRepo.Setup(x => x.GetRuleByIdAsync(1)).ReturnsAsync(new ForumRule { Id = 1 });

        var result = await service.ReportPostAsync(1, Guid.NewGuid(), 1, "Spam");

        Assert.True(result);
    }

    [Fact]
    public async Task ReportPostAsync_ShouldReturnFalse_WhenPostDoesNotExist()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumPostService(mockPostRepo.Object, null!, mockModerationRepo.Object, null!, null!, null!);

        mockPostRepo.Setup(x => x.GetPostByIdAsync(999)).ReturnsAsync((ForumPost?)null);

        var result = await service.ReportPostAsync(999, Guid.NewGuid(), 1, "Spam");

        Assert.False(result);
    }

    [Fact]
    public async Task HidePostByModeratorAsync_ShouldHidePost_WhenValid()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumPostService(mockPostRepo.Object, mockConfigRepo.Object,
            mockModerationRepo.Object, null!, null!, null!);

        var post = new ForumPost { Id = 1, SchoolId = 1 };
        mockPostRepo.Setup(x => x.GetPostByIdAsync(1)).ReturnsAsync(post);
        mockConfigRepo.Setup(x => x.GetAttachmentsByPostIdAsync(1)).ReturnsAsync(new List<ForumAttachment>());

        var result = await service.HidePostByModeratorAsync(1, Guid.NewGuid(), 10);

        Assert.True(result);
    }

    [Fact]
    public async Task HidePostByModeratorAsync_ShouldReturnFalse_WhenPostDoesNotExist()
    {
        var mockPostRepo = new Mock<IForumPostRepository>();
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumPostService(mockPostRepo.Object, mockConfigRepo.Object,
            mockModerationRepo.Object, null!, null!, null!);

        mockPostRepo.Setup(x => x.GetPostByIdAsync(999)).ReturnsAsync((ForumPost?)null);

        var result = await service.HidePostByModeratorAsync(999, Guid.NewGuid(), 10);

        Assert.False(result);
    }
}