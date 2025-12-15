using Microsoft.AspNetCore.Http;
using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class ForumPostServiceTests
{
    private Mock<IForumPostRepository> _mockPostRepo;
    private Mock<IForumConfigRepository> _mockConfigRepo;
    private Mock<IForumModerationRepository> _mockModerationRepo;
    private Mock<ICloudinaryRepository> _mockFileStorage;
    private Mock<IImageModerationService> _mockImageModeration;
    private Mock<ISignalRNotifier> _mockSignalR;
    private ForumPostService _service;

    public ForumPostServiceTests()
    {
        _mockPostRepo = new Mock<IForumPostRepository>();
        _mockConfigRepo = new Mock<IForumConfigRepository>();
        _mockModerationRepo = new Mock<IForumModerationRepository>();
        _mockFileStorage = new Mock<ICloudinaryRepository>();
        _mockImageModeration = new Mock<IImageModerationService>();
        _mockSignalR = new Mock<ISignalRNotifier>();

        _service = new ForumPostService(
            _mockPostRepo.Object,
            _mockConfigRepo.Object,
            _mockModerationRepo.Object,
            _mockFileStorage.Object,
            _mockImageModeration.Object,
            _mockSignalR.Object
        );
    }

    #region CreatePost Tests

    [Fact]
    public async Task CreatePost_ShouldCreateApprovedPost_WhenNoViolationsAndNoProtectedFlair()
    {
        var userId = Guid.NewGuid();
        var post = new ForumPost
        {
            SchoolId = 1,
            SubjectId = 1,
            Title = "Clean Title",
            Content = "Clean content",
            CreatedBy = userId,
            CreatedAt = DateTime.Now
        };

        _mockModerationRepo.Setup(x => x.CheckContentViolationAsync("Clean content", 1))
            .ReturnsAsync(new List<(int, int, int)>());

        var createdPost = new ForumPost
        {
            Id = 1,
            SchoolId = 1,
            SubjectId = 1,
            Title = "Clean Title",
            Content = "Clean content",
            CreatedBy = userId,
            Status = true,
            IsHidden = false,
            TotalViolationScore = 0
        };

        _mockPostRepo.Setup(x => x.CreatePostAsync(It.IsAny<ForumPost>()))
            .ReturnsAsync(createdPost);
        _mockPostRepo.Setup(x => x.GetPostByIdAsync(1))
            .ReturnsAsync(createdPost);

        var result = await _service.CreatePostAsync(post);

        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.True(result.Status);
        Assert.False(result.IsHidden);
        Assert.Equal(0, result.TotalViolationScore);
        _mockPostRepo.Verify(x => x.CreatePostAsync(It.IsAny<ForumPost>()), Times.Once);
    }

    [Fact]
    public async Task CreatePost_ShouldCreatePendingPost_WhenHasViolationsWithProtectedFlair()
    {
        var userId = Guid.NewGuid();
        var post = new ForumPost
        {
            SchoolId = 1,
            SubjectId = 1,
            FlairId = 1,
            Title = "Test Title",
            Content = "Bad content",
            CreatedBy = userId,
            CreatedAt = DateTime.Now
        };

        var flair = new ForumFlair { Id = 1, IsProtected = true };

        _mockConfigRepo.Setup(x => x.GetFlairByIdAsync(1))
            .ReturnsAsync(flair);
        _mockModerationRepo.Setup(x => x.CheckContentViolationAsync("Bad content", 1))
            .ReturnsAsync(new List<(int, int, int)> { (1, 1, 5) });

        var createdPost = new ForumPost
        {
            Id = 1,
            SchoolId = 1,
            FlairId = 1,
            Title = "Test Title",
            Content = "Bad content",
            CreatedBy = userId,
            Status = null,
            IsHidden = false,
            TotalViolationScore = 5
        };

        _mockPostRepo.Setup(x => x.CreatePostAsync(It.IsAny<ForumPost>()))
            .ReturnsAsync(createdPost);
        _mockPostRepo.Setup(x => x.GetPostByIdAsync(1))
            .ReturnsAsync(createdPost);

        var result = await _service.CreatePostAsync(post);

        Assert.NotNull(result);
        Assert.Null(result.Status);
        Assert.Equal(5, result.TotalViolationScore);
        _mockModerationRepo.Verify(x => x.CreateViolationRecordAsync(It.IsAny<ViolationRecord>()), Times.Never);
    }

    [Fact]
    public async Task CreatePost_ShouldCreateRejectedPost_WhenHasViolationsWithoutProtectedFlair()
    {
        var userId = Guid.NewGuid();
        var post = new ForumPost
        {
            SchoolId = 1,
            SubjectId = 1,
            Title = "Test Title",
            Content = "Bad content",
            CreatedBy = userId,
            CreatedAt = DateTime.Now
        };

        _mockModerationRepo.Setup(x => x.CheckContentViolationAsync("Bad content", 1))
            .ReturnsAsync(new List<(int, int, int)> { (1, 1, 10) });

        var createdPost = new ForumPost
        {
            Id = 1,
            SchoolId = 1,
            Title = "Test Title",
            Content = "Bad content",
            CreatedBy = userId,
            Status = false,
            IsHidden = true,
            TotalViolationScore = 10
        };

        _mockPostRepo.Setup(x => x.CreatePostAsync(It.IsAny<ForumPost>()))
            .ReturnsAsync(createdPost);
        _mockPostRepo.Setup(x => x.GetPostByIdAsync(1))
            .ReturnsAsync(createdPost);
        _mockModerationRepo.Setup(x => x.GetUserForumStatusAsync(userId, 1))
            .ReturnsAsync(new UserForumStatus { TotalViolationScore = 0 });

        var result = await _service.CreatePostAsync(post);

        Assert.NotNull(result);
        Assert.False(result.Status);
        Assert.True(result.IsHidden);
        Assert.Equal(10, result.TotalViolationScore);
        _mockModerationRepo.Verify(x => x.AddViolationScoreAsync(userId, 1, 10), Times.Once);
        _mockModerationRepo.Verify(x => x.CreateViolationRecordAsync(It.IsAny<ViolationRecord>()), Times.Once);
    }

    [Fact]
    public async Task CreatePost_ShouldUploadAttachments_WhenAttachmentsProvided()
    {
        var userId = Guid.NewGuid();
        var post = new ForumPost
        {
            SchoolId = 1,
            SubjectId = 1,
            Title = "Test Title",
            Content = "Clean content",
            CreatedBy = userId,
            CreatedAt = DateTime.Now
        };

        var attachments = new List<IFormFile>
        {
            CreateMockFormFile("file1.jpg", "image/jpeg"),
            CreateMockFormFile("file2.pdf", "application/pdf")
        };

        _mockModerationRepo.Setup(x => x.CheckContentViolationAsync("Clean content", 1))
            .ReturnsAsync(new List<(int, int, int)>());
        _mockFileStorage.Setup(x => x.UploadFilesAsync(It.IsAny<List<IFormFile>>(), It.IsAny<string>()))
            .ReturnsAsync(new List<string> { "http://example.com/file1.jpg", "http://example.com/file2.pdf" });

        var createdPost = new ForumPost
        {
            Id = 1,
            SchoolId = 1,
            Title = "Test Title",
            Content = "Clean content",
            CreatedBy = userId,
            Status = true
        };

        _mockPostRepo.Setup(x => x.CreatePostAsync(It.IsAny<ForumPost>()))
            .ReturnsAsync(createdPost);
        _mockPostRepo.Setup(x => x.GetPostByIdAsync(1))
            .ReturnsAsync(createdPost);

        var result = await _service.CreatePostAsync(post, attachments);

        Assert.NotNull(result);
        _mockFileStorage.Verify(x => x.UploadFilesAsync(It.IsAny<List<IFormFile>>(), It.IsAny<string>()), Times.Once);
        _mockConfigRepo.Verify(x => x.CreateAttachmentAsync(It.IsAny<ForumAttachment>()), Times.Exactly(2));
    }

    [Fact]
    public async Task CreatePost_ShouldThrowException_WhenAttachmentUploadFails()
    {
        var userId = Guid.NewGuid();
        var post = new ForumPost
        {
            SchoolId = 1,
            SubjectId = 1,
            Title = "Test Title",
            Content = "Clean content",
            CreatedBy = userId
        };

        var attachments = new List<IFormFile>
        {
            CreateMockFormFile("file1.jpg", "image/jpeg")
        };

        _mockModerationRepo.Setup(x => x.CheckContentViolationAsync("Clean content", 1))
            .ReturnsAsync(new List<(int, int, int)>());
        _mockFileStorage.Setup(x => x.UploadFilesAsync(It.IsAny<List<IFormFile>>(), It.IsAny<string>()))
            .ReturnsAsync(new List<string> { "" });

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.CreatePostAsync(post, attachments));
    }

    [Fact]
    public async Task CreatePost_ShouldMuteUser_WhenViolationScoreDropsToZero()
    {
        var userId = Guid.NewGuid();
        var post = new ForumPost
        {
            SchoolId = 1,
            SubjectId = 1,
            Title = "Test Title",
            Content = "Bad content",
            CreatedBy = userId,
            CreatedAt = DateTime.Now
        };

        _mockModerationRepo.Setup(x => x.CheckContentViolationAsync("Bad content", 1))
            .ReturnsAsync(new List<(int, int, int)> { (1, 1, 10) });
        _mockModerationRepo.Setup(x => x.GetUserForumStatusAsync(userId, 1))
            .ReturnsAsync(new UserForumStatus { TotalViolationScore = 0 });

        var createdPost = new ForumPost
        {
            Id = 1,
            SchoolId = 1,
            Title = "Test Title",
            Content = "Bad content",
            CreatedBy = userId,
            Status = false,
            IsHidden = true,
            TotalViolationScore = 10
        };

        _mockPostRepo.Setup(x => x.CreatePostAsync(It.IsAny<ForumPost>()))
            .ReturnsAsync(createdPost);
        _mockPostRepo.Setup(x => x.GetPostByIdAsync(1))
            .ReturnsAsync(createdPost);

        var result = await _service.CreatePostAsync(post);

        _mockModerationRepo.Verify(x => x.MuteUserAsync(userId, 1, It.IsAny<DateTime>()), Times.Once);
    }

    [Fact]
    public async Task CreatePost_ShouldSetPendingModeration_WhenImageAttachmentsWithProtectedFlair()
    {
        var userId = Guid.NewGuid();
        var post = new ForumPost
        {
            SchoolId = 1,
            SubjectId = 1,
            FlairId = 1,
            Title = "Test Title",
            Content = "Clean content",
            CreatedBy = userId
        };

        var flair = new ForumFlair { Id = 1, IsProtected = true };
        var attachments = new List<IFormFile>
        {
            CreateMockFormFile("image.jpg", "image/jpeg")
        };

        _mockConfigRepo.Setup(x => x.GetFlairByIdAsync(1))
            .ReturnsAsync(flair);
        _mockModerationRepo.Setup(x => x.CheckContentViolationAsync("Clean content", 1))
            .ReturnsAsync(new List<(int, int, int)>());
        _mockFileStorage.Setup(x => x.UploadFilesAsync(It.IsAny<List<IFormFile>>(), It.IsAny<string>()))
            .ReturnsAsync(new List<string> { "http://example.com/image.jpg" });

        var createdPost = new ForumPost
        {
            Id = 1,
            SchoolId = 1,
            FlairId = 1,
            Title = "Test Title",
            Content = "Clean content",
            CreatedBy = userId,
            Status = null
        };

        _mockPostRepo.Setup(x => x.CreatePostAsync(It.IsAny<ForumPost>()))
            .ReturnsAsync(createdPost);
        _mockPostRepo.Setup(x => x.GetPostByIdAsync(1))
            .ReturnsAsync(createdPost);

        var result = await _service.CreatePostAsync(post, attachments);

        Assert.Null(result.Status);
        _mockConfigRepo.Verify(x => x.CreateAttachmentAsync(It.Is<ForumAttachment>(
            a => a.IsModerationPending == false)), Times.Once);
    }

    #endregion

    #region UpdatePost Tests

    [Fact]
    public async Task UpdatePost_ShouldUpdatePost_WhenValidDataProvided()
    {
        var userId = Guid.NewGuid();
        var existingPost = new ForumPost
        {
            Id = 1,
            SchoolId = 1,
            SubjectId = 1,
            FlairId = 1,
            Title = "Old Title",
            Content = "Old Content",
            CreatedBy = userId,
            IsHidden = false,
            Status = true,
            TotalViolationScore = 0
        };

        var updatedPost = new ForumPost
        {
            Id = 1,
            SchoolId = 1,
            SubjectId = 1,
            FlairId = 2,
            Title = "New Title",
            Content = "New Content",
            UpdatedBy = userId
        };

        _mockPostRepo.Setup(x => x.GetPostByIdAsync(1))
            .ReturnsAsync(existingPost);
        _mockPostRepo.Setup(x => x.UpdatePostAsync(It.IsAny<ForumPost>()))
            .ReturnsAsync(updatedPost);

        var result = await _service.UpdatePostAsync(updatedPost);

        Assert.NotNull(result);
        Assert.Equal("New Title", result.Title);
        Assert.Equal("New Content", result.Content);
        _mockPostRepo.Verify(x => x.UpdatePostAsync(It.IsAny<ForumPost>()), Times.Once);
    }

    [Fact]
    public async Task UpdatePostWithAttachments_ShouldDeleteOldAttachments_WhenDeletedUrlsProvided()
    {
        var userId = Guid.NewGuid();
        var post = new ForumPost
        {
            Id = 1,
            SchoolId = 1,
            Title = "Updated Title",
            Content = "Updated Content",
            CreatedBy = userId,
            UpdatedBy = userId
        };

        var existingAttachments = new List<ForumAttachment>
        {
            new ForumAttachment { Id = 1, PostId = 1, FileUrl = "http://example.com/old1.jpg" },
            new ForumAttachment { Id = 2, PostId = 1, FileUrl = "http://example.com/old2.jpg" }
        };

        var deletedUrls = new List<string> { "http://example.com/old1.jpg" };

        _mockConfigRepo.Setup(x => x.GetAttachmentsByPostIdAsync(1))
            .ReturnsAsync(existingAttachments);
        _mockPostRepo.Setup(x => x.UpdatePostAsync(It.IsAny<ForumPost>()))
            .ReturnsAsync(post);

        var result = await _service.UpdatePostWithAttachmentsAsync(post, null, deletedUrls);

        _mockConfigRepo.Verify(x => x.SoftDeleteAttachmentAsync(1), Times.Once);
        _mockFileStorage.Verify(x => x.DeleteFileAsync("http://example.com/old1.jpg"), Times.Once);
    }

    [Fact]
    public async Task UpdatePostWithAttachments_ShouldUploadNewAttachments_WhenNewAttachmentsProvided()
    {
        var userId = Guid.NewGuid();
        var post = new ForumPost
        {
            Id = 1,
            SchoolId = 1,
            Title = "Updated Title",
            Content = "Updated Content",
            CreatedBy = userId,
            UpdatedBy = userId
        };

        var newAttachments = new List<IFormFile>
        {
            CreateMockFormFile("new1.jpg", "image/jpeg"),
            CreateMockFormFile("new2.pdf", "application/pdf")
        };

        _mockConfigRepo.Setup(x => x.GetAttachmentsByPostIdAsync(1))
            .ReturnsAsync(new List<ForumAttachment>());
        _mockFileStorage.Setup(x => x.UploadFileAsync(It.IsAny<IFormFile>(), It.IsAny<string>()))
            .ReturnsAsync("http://example.com/uploaded.jpg");
        _mockImageModeration.Setup(x => x.ModerateImageFromStreamAsync(It.IsAny<Stream>()))
            .ReturnsAsync(new ImageModerationResult { IsViolation = false });
        _mockPostRepo.Setup(x => x.UpdatePostAsync(It.IsAny<ForumPost>()))
            .ReturnsAsync(post);

        var result = await _service.UpdatePostWithAttachmentsAsync(post, newAttachments, null);

        _mockFileStorage.Verify(x => x.UploadFileAsync(It.IsAny<IFormFile>(), It.IsAny<string>()), Times.Exactly(2));
        _mockConfigRepo.Verify(x => x.CreateAttachmentAsync(It.IsAny<ForumAttachment>()), Times.Exactly(2));
    }
    [Fact]
    public async Task UpdatePost_ShouldReturnUpdatedPost_WhenValidDataProvided()
    {
        var userId = Guid.NewGuid();
        var post = new ForumPost
        {
            Id = 1,
            Title = "Updated Title",
            Content = "Updated Content",
            UpdatedBy = userId
        };

        _mockPostRepo.Setup(x => x.UpdatePostAsync(It.IsAny<ForumPost>()))
            .ReturnsAsync(post);

        var result = await _service.UpdatePostAsync(post);

        Assert.NotNull(result);
        Assert.Equal("Updated Title", result.Title);
        _mockPostRepo.Verify(x => x.UpdatePostAsync(It.IsAny<ForumPost>()), Times.Once);
    }

    [Fact]
    public async Task UpdatePostWithAttachments_ShouldSkipViolatingImages_WhenImageModerationFails()
    {
        var userId = Guid.NewGuid();
        var post = new ForumPost
        {
            Id = 1,
            SchoolId = 1,
            Title = "Updated Title",
            Content = "Updated Content",
            CreatedBy = userId,
            UpdatedBy = userId
        };

        var newAttachments = new List<IFormFile>
        {
            CreateMockFormFile("bad.jpg", "image/jpeg")
        };

        _mockConfigRepo.Setup(x => x.GetAttachmentsByPostIdAsync(1))
            .ReturnsAsync(new List<ForumAttachment>());
        _mockImageModeration.Setup(x => x.ModerateImageFromStreamAsync(It.IsAny<Stream>()))
            .ReturnsAsync(new ImageModerationResult { IsViolation = true });
        _mockPostRepo.Setup(x => x.UpdatePostAsync(It.IsAny<ForumPost>()))
            .ReturnsAsync(post);

        var result = await _service.UpdatePostWithAttachmentsAsync(post, newAttachments, null);

        _mockFileStorage.Verify(x => x.UploadFileAsync(It.IsAny<IFormFile>(), It.IsAny<string>()), Times.Never);
        _mockConfigRepo.Verify(x => x.CreateAttachmentAsync(It.IsAny<ForumAttachment>()), Times.Never);
    }

    [Fact]
    public async Task UpdatePostWithAttachments_ShouldHandleMixedOperations_WhenBothDeleteAndUpload()
    {
        var userId = Guid.NewGuid();
        var post = new ForumPost
        {
            Id = 1,
            SchoolId = 1,
            Title = "Updated Title",
            Content = "Updated Content",
            CreatedBy = userId,
            UpdatedBy = userId
        };

        var existingAttachments = new List<ForumAttachment>
        {
            new ForumAttachment { Id = 1, PostId = 1, FileUrl = "http://example.com/old.jpg" }
        };

        var deletedUrls = new List<string> { "http://example.com/old.jpg" };
        var newAttachments = new List<IFormFile>
        {
            CreateMockFormFile("new.jpg", "image/jpeg")
        };

        _mockConfigRepo.Setup(x => x.GetAttachmentsByPostIdAsync(1))
            .ReturnsAsync(existingAttachments);
        _mockFileStorage.Setup(x => x.UploadFileAsync(It.IsAny<IFormFile>(), It.IsAny<string>()))
            .ReturnsAsync("http://example.com/new.jpg");
        _mockImageModeration.Setup(x => x.ModerateImageFromStreamAsync(It.IsAny<Stream>()))
            .ReturnsAsync(new ImageModerationResult { IsViolation = false });
        _mockPostRepo.Setup(x => x.UpdatePostAsync(It.IsAny<ForumPost>()))
            .ReturnsAsync(post);

        var result = await _service.UpdatePostWithAttachmentsAsync(post, newAttachments, deletedUrls);

        _mockConfigRepo.Verify(x => x.SoftDeleteAttachmentAsync(1), Times.Once);
        _mockFileStorage.Verify(x => x.DeleteFileAsync("http://example.com/old.jpg"), Times.Once);
        _mockFileStorage.Verify(x => x.UploadFileAsync(It.IsAny<IFormFile>(), It.IsAny<string>()), Times.Once);
        _mockConfigRepo.Verify(x => x.CreateAttachmentAsync(It.IsAny<ForumAttachment>()), Times.Once);
    }

    [Fact]
    public async Task UpdatePostWithAttachments_ShouldValidateAttachmentFile_WhenInvalidFileProvided()
    {
        var userId = Guid.NewGuid();
        var post = new ForumPost
        {
            Id = 1,
            SchoolId = 1,
            Title = "Updated Title",
            Content = "Updated Content",
            CreatedBy = userId,
            UpdatedBy = userId
        };

        var invalidAttachment = CreateMockFormFile("test.exe", "application/x-msdownload");
        var newAttachments = new List<IFormFile> { invalidAttachment };

        _mockConfigRepo.Setup(x => x.GetAttachmentsByPostIdAsync(1))
            .ReturnsAsync(new List<ForumAttachment>());

        await Assert.ThrowsAsync<ArgumentException>(
            () => _service.UpdatePostWithAttachmentsAsync(post, newAttachments, null));
    }

    #endregion

    #region Helper Methods

    private static IFormFile CreateMockFormFile(string fileName, string contentType, long length = 1024)
    {
        var content = new byte[length];
        var stream = new MemoryStream(content);

        var file = new Mock<IFormFile>();
        file.Setup(f => f.FileName).Returns(fileName);
        file.Setup(f => f.ContentType).Returns(contentType);
        file.Setup(f => f.Length).Returns(length);
        file.Setup(f => f.OpenReadStream()).Returns(stream);
        file.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .Returns((Stream target, CancellationToken token) => stream.CopyToAsync(target, token));

        return file.Object;
    }

    #endregion
}