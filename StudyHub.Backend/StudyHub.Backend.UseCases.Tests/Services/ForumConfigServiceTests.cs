using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class ForumConfigServiceTests
{
    [Fact]
    public async Task GetFlairByIdAsync_ShouldReturnFlair_WhenFlairExists()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var flair = new ForumFlair { Id = 1, Name = "Test Flair" };
        mockConfigRepo.Setup(x => x.GetFlairByIdAsync(1)).ReturnsAsync(flair);

        var result = await service.GetFlairByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("Test Flair", result.Name);
    }

    [Fact]
    public async Task GetFlairByIdAsync_ShouldReturnNull_WhenFlairDoesNotExist()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        mockConfigRepo.Setup(x => x.GetFlairByIdAsync(999)).ReturnsAsync((ForumFlair?)null);

        var result = await service.GetFlairByIdAsync(999);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetFlairsBySchoolAsync_ShouldReturnFlairs_WhenFlairsExist()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var flairs = new List<ForumFlair>
        {
            new ForumFlair { Id = 1, SchoolId = 1 },
            new ForumFlair { Id = 2, SchoolId = 1 }
        };
        mockConfigRepo.Setup(x => x.GetFlairsBySchoolIdAsync(1, null, null, null, null))
            .ReturnsAsync((flairs, 2));

        var result = await service.GetFlairsBySchoolAsync(1);

        Assert.Equal(2, result.totalCount);
    }

    [Fact]
    public async Task GetFlairsBySchoolAsync_ShouldReturnEmpty_WhenNoFlairsExist()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        mockConfigRepo.Setup(x => x.GetFlairsBySchoolIdAsync(1, null, null, null, null))
            .ReturnsAsync((new List<ForumFlair>(), 0));

        var result = await service.GetFlairsBySchoolAsync(1);

        Assert.Equal(0, result.totalCount);
        Assert.Empty(result.flairs);
    }

    [Fact]
    public async Task GetActiveFlairsBySchoolAsync_ShouldReturnActiveFlairs_WhenExist()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var flairs = new List<ForumFlair>
        {
            new ForumFlair { Id = 1, SchoolId = 1, Status = true }
        };
        mockConfigRepo.Setup(x => x.GetActiveFlairsBySchoolIdAsync(1)).ReturnsAsync(flairs);

        var result = await service.GetActiveFlairsBySchoolAsync(1);

        Assert.Single(result);
        Assert.True(result[0].Status);
    }

    [Fact]
    public async Task GetProtectedFlairsBySchoolAsync_ShouldReturnProtectedFlairs_WhenExist()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var flairs = new List<ForumFlair>
        {
            new ForumFlair { Id = 1, SchoolId = 1, IsProtected = true, Status = true }
        };
        mockConfigRepo.Setup(x => x.GetProtectedFlairsBySchoolIdAsync(1)).ReturnsAsync(flairs);

        var result = await service.GetProtectedFlairsBySchoolAsync(1);

        Assert.Single(result);
        Assert.True(result[0].IsProtected);
    }

    [Fact]
    public async Task CreateFlairAsync_ShouldCreateFlair_WhenValid()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var flair = new ForumFlair { Name = "New Flair", SchoolId = 1 };
        mockConfigRepo.Setup(x => x.CreateFlairAsync(It.IsAny<ForumFlair>())).ReturnsAsync(flair);

        var result = await service.CreateFlairAsync(flair);

        Assert.NotNull(result);
        Assert.Equal("New Flair", result.Name);
    }

    [Fact]
    public async Task CreateFlairAsync_ShouldThrowException_WhenNameIsEmpty()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var flair = new ForumFlair { Name = "", SchoolId = 1 };

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateFlairAsync(flair));
    }

    [Fact]
    public async Task CreateFlairAsync_ShouldThrowException_WhenNameIsNull()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var flair = new ForumFlair { Name = null!, SchoolId = 1 };

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateFlairAsync(flair));
    }

    [Fact]
    public async Task UpdateFlairAsync_ShouldUpdateFlair_WhenValid()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var flair = new ForumFlair { Id = 1, Name = "Updated Flair" };
        mockConfigRepo.Setup(x => x.GetFlairByIdAsync(1)).ReturnsAsync(flair);
        mockConfigRepo.Setup(x => x.UpdateFlairAsync(It.IsAny<ForumFlair>())).ReturnsAsync(flair);

        var result = await service.UpdateFlairAsync(flair);

        Assert.Equal("Updated Flair", result.Name);
    }

    [Fact]
    public async Task UpdateFlairAsync_ShouldThrowException_WhenFlairDoesNotExist()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var flair = new ForumFlair { Id = 999, Name = "Updated" };
        mockConfigRepo.Setup(x => x.GetFlairByIdAsync(999)).ReturnsAsync((ForumFlair?)null);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpdateFlairAsync(flair));
    }

    [Fact]
    public async Task DeleteFlairAsync_ShouldDeleteFlair_WhenFlairExists()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var flair = new ForumFlair { Id = 1 };
        mockConfigRepo.Setup(x => x.GetFlairByIdAsync(1)).ReturnsAsync(flair);
        mockConfigRepo.Setup(x => x.DeleteFlairAsync(1)).ReturnsAsync(true);

        var result = await service.DeleteFlairAsync(1);

        Assert.True(result);
    }

    [Fact]
    public async Task DeleteFlairAsync_ShouldReturnFalse_WhenFlairDoesNotExist()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        mockConfigRepo.Setup(x => x.GetFlairByIdAsync(999)).ReturnsAsync((ForumFlair?)null);

        var result = await service.DeleteFlairAsync(999);

        Assert.False(result);
    }

    [Fact]
    public async Task ToggleFlairStatusAsync_ShouldToggleStatus_WhenFlairExists()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var flair = new ForumFlair { Id = 1, Status = true };
        mockConfigRepo.Setup(x => x.GetFlairByIdAsync(1)).ReturnsAsync(flair);
        mockConfigRepo.Setup(x => x.ToggleFlairStatusAsync(1)).ReturnsAsync(true);

        var result = await service.ToggleFlairStatusAsync(1);

        Assert.True(result);
    }

    [Fact]
    public async Task ToggleFlairStatusAsync_ShouldReturnFalse_WhenFlairDoesNotExist()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        mockConfigRepo.Setup(x => x.GetFlairByIdAsync(999)).ReturnsAsync((ForumFlair?)null);

        var result = await service.ToggleFlairStatusAsync(999);

        Assert.False(result);
    }

    [Fact]
    public async Task GetAttachmentByIdAsync_ShouldReturnAttachment_WhenExists()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var attachment = new ForumAttachment { Id = 1, FileUrl = "test.jpg" };
        mockConfigRepo.Setup(x => x.GetAttachmentByIdAsync(1)).ReturnsAsync(attachment);

        var result = await service.GetAttachmentByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("test.jpg", result.FileUrl);
    }

    [Fact]
    public async Task GetAttachmentByIdAsync_ShouldReturnNull_WhenDoesNotExist()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        mockConfigRepo.Setup(x => x.GetAttachmentByIdAsync(999)).ReturnsAsync((ForumAttachment?)null);

        var result = await service.GetAttachmentByIdAsync(999);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetAttachmentsByPostIdAsync_ShouldReturnAttachments_WhenExist()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var attachments = new List<ForumAttachment>
        {
            new ForumAttachment { Id = 1, PostId = 1 },
            new ForumAttachment { Id = 2, PostId = 1 }
        };
        mockConfigRepo.Setup(x => x.GetAttachmentsByPostIdAsync(1)).ReturnsAsync(attachments);

        var result = await service.GetAttachmentsByPostIdAsync(1);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetAttachmentsByCommentIdAsync_ShouldReturnAttachments_WhenExist()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var attachments = new List<ForumAttachment>
        {
            new ForumAttachment { Id = 1, CommentId = 1 },
            new ForumAttachment { Id = 2, CommentId = 1 }
        };
        mockConfigRepo.Setup(x => x.GetAttachmentsByCommentIdAsync(1)).ReturnsAsync(attachments);

        var result = await service.GetAttachmentsByCommentIdAsync(1);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task CreateAttachmentAsync_ShouldCreateAttachment_WhenValid()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var attachment = new ForumAttachment { FileUrl = "test.jpg" };
        mockConfigRepo.Setup(x => x.CreateAttachmentAsync(It.IsAny<ForumAttachment>())).ReturnsAsync(attachment);

        var result = await service.CreateAttachmentAsync(attachment);

        Assert.NotNull(result);
        Assert.Equal("test.jpg", result.FileUrl);
    }

    [Fact]
    public async Task CreateAttachmentAsync_ShouldThrowException_WhenFileUrlIsEmpty()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var attachment = new ForumAttachment { FileUrl = "" };

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAttachmentAsync(attachment));
    }

    [Fact]
    public async Task SoftDeleteAttachmentAsync_ShouldDeleteAttachment_WhenExists()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var attachment = new ForumAttachment { Id = 1 };
        mockConfigRepo.Setup(x => x.GetAttachmentByIdAsync(1)).ReturnsAsync(attachment);
        mockConfigRepo.Setup(x => x.SoftDeleteAttachmentAsync(1)).ReturnsAsync(true);

        var result = await service.SoftDeleteAttachmentAsync(1);

        Assert.True(result);
    }

    [Fact]
    public async Task SoftDeleteAttachmentAsync_ShouldReturnFalse_WhenDoesNotExist()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        mockConfigRepo.Setup(x => x.GetAttachmentByIdAsync(999)).ReturnsAsync((ForumAttachment?)null);

        var result = await service.SoftDeleteAttachmentAsync(999);

        Assert.False(result);
    }

    [Fact]
    public async Task ApproveAttachmentAsync_ShouldApproveAttachment_WhenExists()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var attachment = new ForumAttachment { Id = 1 };
        mockConfigRepo.Setup(x => x.GetAttachmentByIdAsync(1)).ReturnsAsync(attachment);
        mockConfigRepo.Setup(x => x.ApproveAttachmentAsync(1, It.IsAny<Guid>())).ReturnsAsync(true);

        var result = await service.ApproveAttachmentAsync(1, Guid.NewGuid());

        Assert.True(result);
    }

    [Fact]
    public async Task ApproveAttachmentAsync_ShouldReturnFalse_WhenDoesNotExist()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        mockConfigRepo.Setup(x => x.GetAttachmentByIdAsync(999)).ReturnsAsync((ForumAttachment?)null);

        var result = await service.ApproveAttachmentAsync(999, Guid.NewGuid());

        Assert.False(result);
    }

    [Fact]
    public async Task RejectAttachmentAsync_ShouldRejectAttachment_WhenExists()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        var attachment = new ForumAttachment { Id = 1 };
        mockConfigRepo.Setup(x => x.GetAttachmentByIdAsync(1)).ReturnsAsync(attachment);
        mockConfigRepo.Setup(x => x.RejectAttachmentAsync(1)).ReturnsAsync(true);

        var result = await service.RejectAttachmentAsync(1);

        Assert.True(result);
    }

    [Fact]
    public async Task RejectAttachmentAsync_ShouldReturnFalse_WhenDoesNotExist()
    {
        var mockConfigRepo = new Mock<IForumConfigRepository>();
        var service = new ForumConfigService(mockConfigRepo.Object);

        mockConfigRepo.Setup(x => x.GetAttachmentByIdAsync(999)).ReturnsAsync((ForumAttachment?)null);

        var result = await service.RejectAttachmentAsync(999);

        Assert.False(result);
    }
}