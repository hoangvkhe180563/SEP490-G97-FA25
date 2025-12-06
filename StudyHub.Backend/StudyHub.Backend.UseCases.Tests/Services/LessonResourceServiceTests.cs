using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class LessonResourceServiceTests
{
    #region GetById Tests

    [Fact]
    public void GetById_ShouldReturnResource_WhenResourceExists()
    {
        // Arrange
        var mockRepo = new Mock<ILessonResourceRepository>();
        var service = new LessonResourceService(mockRepo.Object);

        var resourceId = 1;
        var resource = new LessonResource
        {
            Id = resourceId,
            Url = "https://example.com/resource1.pdf"
        };

        mockRepo.Setup(x => x.GetById(resourceId))
            .Returns(resource);

        // Act
        var result = service.GetById(resourceId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(resourceId, result.Id);
        Assert.Equal("https://example.com/resource1.pdf", result.Url);
        mockRepo.Verify(x => x.GetById(resourceId), Times.Once);
    }

    [Fact]
    public void GetById_ShouldReturnNull_WhenResourceDoesNotExist()
    {
        // Arrange
        var mockRepo = new Mock<ILessonResourceRepository>();
        var service = new LessonResourceService(mockRepo.Object);

        var resourceId = 999;
        mockRepo.Setup(x => x.GetById(resourceId))
            .Returns((LessonResource?)null);

        // Act
        var result = service.GetById(resourceId);

        // Assert
        Assert.Null(result);
        mockRepo.Verify(x => x.GetById(resourceId), Times.Once);
    }

    [Fact]
    public void GetById_ShouldHandleDifferentResourceTypes_WhenCalled()
    {
        // Arrange
        var mockRepo = new Mock<ILessonResourceRepository>();
        var service = new LessonResourceService(mockRepo.Object);

        var pdfResource = new LessonResource
        {
            Id = 1,
            Url = "https://example.com/document.pdf"
        };

        var videoResource = new LessonResource
        {
            Id = 2,
            Url = "https://example.com/video.mp4"
        };

        mockRepo.Setup(x => x.GetById(1)).Returns(pdfResource);
        mockRepo.Setup(x => x.GetById(2)).Returns(videoResource);

        // Act
        var result1 = service.GetById(1);
        var result2 = service.GetById(2);

        // Assert
        Assert.NotNull(result1);
        Assert.NotNull(result2);
        Assert.Contains(".pdf", result1.Url);
        Assert.Contains(".mp4", result2.Url);
    }

    #endregion

    #region Create Tests

    [Fact]
    public void Create_ShouldCreateAndReturnResource_WhenValidDataProvided()
    {
        // Arrange
        var mockRepo = new Mock<ILessonResourceRepository>();
        var service = new LessonResourceService(mockRepo.Object);

        var newResource = new LessonResource
        {
            Url = "https://example.com/new-resource.pdf"
        };

        var createdResource = new LessonResource
        {
            Id = 1,
            Url = newResource.Url
        };

        mockRepo.Setup(x => x.Create(newResource))
            .Returns(createdResource);

        // Act
        var result = service.Create(newResource);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("https://example.com/new-resource.pdf", result.Url);
        mockRepo.Verify(x => x.Create(newResource), Times.Once);
    }

    [Fact]
    public void Create_ShouldHandleMultipleResources_WhenCalled()
    {
        // Arrange
        var mockRepo = new Mock<ILessonResourceRepository>();
        var service = new LessonResourceService(mockRepo.Object);

        var resource1 = new LessonResource { Url = "https://example.com/res1.pdf" };
        var resource2 = new LessonResource { Url = "https://example.com/res2.pdf" };

        mockRepo.Setup(x => x.Create(It.IsAny<LessonResource>()))
            .Returns((LessonResource r) => new LessonResource
            {
                Id = 1,
                Url = r.Url
            });

        // Act
        var result1 = service.Create(resource1);
        var result2 = service.Create(resource2);

        // Assert
        Assert.NotNull(result1);
        Assert.NotNull(result2);
        Assert.Equal("https://example.com/res1.pdf", result1.Url);
        Assert.Equal("https://example.com/res2.pdf", result2.Url);
        mockRepo.Verify(x => x.Create(It.IsAny<LessonResource>()), Times.Exactly(2));
    }

    [Fact]
    public void Create_ShouldHandleDifferentUrlFormats_WhenCalled()
    {
        // Arrange
        var mockRepo = new Mock<ILessonResourceRepository>();
        var service = new LessonResourceService(mockRepo.Object);

        var httpResource = new LessonResource { Url = "http://example.com/file.pdf" };
        var httpsResource = new LessonResource { Url = "https://secure.com/file.pdf" };

        mockRepo.Setup(x => x.Create(It.IsAny<LessonResource>()))
            .Returns((LessonResource r) => new LessonResource
            {
                Id = 1,
                Url = r.Url
            });

        // Act
        var httpResult = service.Create(httpResource);
        var httpsResult = service.Create(httpsResource);

        // Assert
        Assert.NotNull(httpResult);
        Assert.NotNull(httpsResult);
        Assert.StartsWith("http://", httpResult.Url);
        Assert.StartsWith("https://", httpsResult.Url);
    }

    #endregion

    #region Update Tests

    [Fact]
    public void Update_ShouldUpdateAndReturnResource_WhenValidDataProvided()
    {
        // Arrange
        var mockRepo = new Mock<ILessonResourceRepository>();
        var service = new LessonResourceService(mockRepo.Object);

        var updatedResource = new LessonResource
        {
            Id = 1,
            Url = "https://example.com/updated-resource.pdf"
        };

        mockRepo.Setup(x => x.Update(updatedResource))
            .Returns(updatedResource);

        // Act
        var result = service.Update(updatedResource);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("https://example.com/updated-resource.pdf", result.Url);
        mockRepo.Verify(x => x.Update(updatedResource), Times.Once);
    }

    [Fact]
    public void Update_ShouldPreserveResourceId_WhenUpdating()
    {
        // Arrange
        var mockRepo = new Mock<ILessonResourceRepository>();
        var service = new LessonResourceService(mockRepo.Object);

        var resourceId = 5;
        var updatedResource = new LessonResource
        {
            Id = resourceId,
            Url = "https://example.com/new-url.pdf"
        };

        mockRepo.Setup(x => x.Update(updatedResource))
            .Returns(updatedResource);

        // Act
        var result = service.Update(updatedResource);

        // Assert
        Assert.Equal(resourceId, result.Id);
        Assert.Equal("https://example.com/new-url.pdf", result.Url);
    }

    [Fact]
    public void Update_ShouldHandleUrlChange_WhenCalled()
    {
        // Arrange
        var mockRepo = new Mock<ILessonResourceRepository>();
        var service = new LessonResourceService(mockRepo.Object);

        var originalUrl = "https://example.com/old.pdf";
        var newUrl = "https://example.com/new.pdf";

        var resource = new LessonResource
        {
            Id = 1,
            Url = newUrl
        };

        mockRepo.Setup(x => x.Update(resource))
            .Returns(resource);

        // Act
        var result = service.Update(resource);

        // Assert
        Assert.NotEqual(originalUrl, result.Url);
        Assert.Equal(newUrl, result.Url);
    }

    #endregion

    #region Delete Tests

    [Fact]
    public void Delete_ShouldReturnTrue_WhenResourceDeletedSuccessfully()
    {
        // Arrange
        var mockRepo = new Mock<ILessonResourceRepository>();
        var service = new LessonResourceService(mockRepo.Object);

        var resourceId = 1;
        mockRepo.Setup(x => x.Delete(resourceId))
            .Returns(true);

        // Act
        var result = service.Delete(resourceId);

        // Assert
        Assert.True(result);
        mockRepo.Verify(x => x.Delete(resourceId), Times.Once);
    }

    [Fact]
    public void Delete_ShouldReturnFalse_WhenResourceDeletionFails()
    {
        // Arrange
        var mockRepo = new Mock<ILessonResourceRepository>();
        var service = new LessonResourceService(mockRepo.Object);

        var resourceId = 999;
        mockRepo.Setup(x => x.Delete(resourceId))
            .Returns(false);

        // Act
        var result = service.Delete(resourceId);

        // Assert
        Assert.False(result);
        mockRepo.Verify(x => x.Delete(resourceId), Times.Once);
    }

    [Fact]
    public void Delete_ShouldReturnFalse_WhenResourceDoesNotExist()
    {
        // Arrange
        var mockRepo = new Mock<ILessonResourceRepository>();
        var service = new LessonResourceService(mockRepo.Object);

        var nonExistentId = 9999;
        mockRepo.Setup(x => x.Delete(nonExistentId))
            .Returns(false);

        // Act
        var result = service.Delete(nonExistentId);

        // Assert
        Assert.False(result);
        mockRepo.Verify(x => x.Delete(nonExistentId), Times.Once);
    }

    [Fact]
    public void Delete_ShouldHandleMultipleDeletions_WhenCalled()
    {
        // Arrange
        var mockRepo = new Mock<ILessonResourceRepository>();
        var service = new LessonResourceService(mockRepo.Object);

        mockRepo.Setup(x => x.Delete(1)).Returns(true);
        mockRepo.Setup(x => x.Delete(2)).Returns(true);
        mockRepo.Setup(x => x.Delete(3)).Returns(false);

        // Act
        var result1 = service.Delete(1);
        var result2 = service.Delete(2);
        var result3 = service.Delete(3);

        // Assert
        Assert.True(result1);
        Assert.True(result2);
        Assert.False(result3);
        mockRepo.Verify(x => x.Delete(It.IsAny<int>()), Times.Exactly(3));
    }

    #endregion
}
