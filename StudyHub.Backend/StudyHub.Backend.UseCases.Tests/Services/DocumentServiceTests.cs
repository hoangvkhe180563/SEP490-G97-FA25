using Microsoft.AspNetCore.Http;
using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class DocumentServiceTests
{
    #region GetDocumentById Tests

    [Fact]
    public void GetDocumentById_ShouldReturnDocument_WhenDocumentExists()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, Name = "Test Doc" };
        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);

        var result = service.GetDocumentById(1);

        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("Test Doc", result.Name);
        mockRepo.Verify(x => x.GetDocumentById(1), Times.Once);
    }

    [Fact]
    public void GetDocumentById_ShouldReturnNull_WhenDocumentDoesNotExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetDocumentById(999)).Returns((Document?)null);

        var result = service.GetDocumentById(999);

        Assert.Null(result);
        mockRepo.Verify(x => x.GetDocumentById(999), Times.Once);
    }

    #endregion

    #region GetPublicDocuments Tests

    [Fact]
    public void GetPublicDocuments_ShouldReturnDocuments_WhenDocumentsExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document>
        {
            new Document { Id = 1, Name = "Doc1" },
            new Document { Id = 2, Name = "Doc2" }
        };
        mockRepo.Setup(x => x.GetPublicDocuments(null, null, null, null, null, null, null, 1, 10))
            .Returns((documents, 2));

        var result = service.GetPublicDocuments(pageNumber: 1, pageSize: 10);

        Assert.Equal(2, result.documents.Count);
        Assert.Equal(2, result.totalCount);
        mockRepo.Verify(x => x.GetPublicDocuments(null, null, null, null, null, null, null, 1, 10), Times.Once);
    }

    [Fact]
    public void GetPublicDocuments_ShouldReturnEmpty_WhenNoDocumentsExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetPublicDocuments(null, null, null, null, null, null, null, 1, 10))
            .Returns((new List<Document>(), 0));

        var result = service.GetPublicDocuments(pageNumber: 1, pageSize: 10);

        Assert.Empty(result.documents);
        Assert.Equal(0, result.totalCount);
    }

    [Fact]
    public void GetPublicDocuments_ShouldFilterByQuery_WhenQueryProvided()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 1, Name = "Test Doc" } };
        mockRepo.Setup(x => x.GetPublicDocuments("test", null, null, null, null, null, null, 1, 10))
            .Returns((documents, 1));

        var result = service.GetPublicDocuments(query: "test", pageNumber: 1, pageSize: 10);

        Assert.Single(result.documents);
        mockRepo.Verify(x => x.GetPublicDocuments("test", null, null, null, null, null, null, 1, 10), Times.Once);
    }

    [Fact]
    public void GetPublicDocuments_ShouldFilterByCategoryId_WhenCategoryIdProvided()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 1, DocumentCategoryId = 5 } };
        mockRepo.Setup(x => x.GetPublicDocuments(null, 5, null, null, null, null, null, 1, 10))
            .Returns((documents, 1));

        var result = service.GetPublicDocuments(categoryId: 5, pageNumber: 1, pageSize: 10);

        Assert.Single(result.documents);
        Assert.Equal(5, result.documents[0].DocumentCategoryId);
    }

    [Fact]
    public void GetPublicDocuments_ShouldFilterByGrade_WhenGradeProvided()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 1, Grade = 10 } };
        mockRepo.Setup(x => x.GetPublicDocuments(null, null, 10, null, null, null, null, 1, 10))
            .Returns((documents, 1));

        var result = service.GetPublicDocuments(grade: 10, pageNumber: 1, pageSize: 10);

        Assert.Single(result.documents);
        Assert.Equal(10, result.documents[0].Grade);
    }

    [Fact]
    public void GetPublicDocuments_ShouldFilterBySubject_WhenSubjectProvided()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 1, Subject = new Subject { Name = "Math" } } };
        mockRepo.Setup(x => x.GetPublicDocuments(null, null, null, "Math", null, null, null, 1, 10))
            .Returns((documents, 1));

        var result = service.GetPublicDocuments(subject: "Math", pageNumber: 1, pageSize: 10);

        Assert.Single(result.documents);
    }

    [Fact]
    public void GetPublicDocuments_ShouldFilterByDocumentLengthType_WhenProvided()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 1, DocumentLengthType = "Short" } };
        mockRepo.Setup(x => x.GetPublicDocuments(null, null, null, null, null, "Short", null, 1, 10))
            .Returns((documents, 1));

        var result = service.GetPublicDocuments(documentLengthType: "Short", pageNumber: 1, pageSize: 10);

        Assert.Single(result.documents);
        Assert.Equal("Short", result.documents[0].DocumentLengthType);
    }

    [Fact]
    public void GetPublicDocuments_ShouldFilterByDocumentLevel_WhenProvided()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 1, DocumentLevel = "Easy" } };
        mockRepo.Setup(x => x.GetPublicDocuments(null, null, null, null, null, null, "Easy", 1, 10))
            .Returns((documents, 1));

        var result = service.GetPublicDocuments(documentLevel: "Easy", pageNumber: 1, pageSize: 10);

        Assert.Single(result.documents);
        Assert.Equal("Easy", result.documents[0].DocumentLevel);
    }

    [Fact]
    public void GetPublicDocuments_ShouldHandlePagination_WhenMultiplePages()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 11 }, new Document { Id = 12 } };
        mockRepo.Setup(x => x.GetPublicDocuments(null, null, null, null, null, null, null, 2, 10))
            .Returns((documents, 15));

        var result = service.GetPublicDocuments(pageNumber: 2, pageSize: 10);

        Assert.Equal(2, result.documents.Count);
        Assert.Equal(15, result.totalCount);
    }

    #endregion

    #region GetSchoolDocuments Tests

    [Fact]
    public void GetSchoolDocuments_ShouldReturnDocuments_WhenDocumentsExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 1, SchoolId = 5 } };
        mockRepo.Setup(x => x.GetSchoolDocuments(5, null, null, null, null, null, null, null, 1, 10))
            .Returns((documents, 1));

        var result = service.GetSchoolDocuments(5, pageNumber: 1, pageSize: 10);

        Assert.Single(result.documents);
        Assert.Equal(5, result.documents[0].SchoolId);
    }

    [Fact]
    public void GetSchoolDocuments_ShouldReturnEmpty_WhenNoDocumentsExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetSchoolDocuments(999, null, null, null, null, null, null, null, 1, 10))
            .Returns((new List<Document>(), 0));

        var result = service.GetSchoolDocuments(999, pageNumber: 1, pageSize: 10);

        Assert.Empty(result.documents);
    }

    [Fact]
    public void GetSchoolDocuments_ShouldFilterByQuery_WhenQueryProvided()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 1, Name = "School Doc" } };
        mockRepo.Setup(x => x.GetSchoolDocuments(5, "test", null, null, null, null, null, null, 1, 10))
            .Returns((documents, 1));

        var result = service.GetSchoolDocuments(5, query: "test", pageNumber: 1, pageSize: 10);

        Assert.Single(result.documents);
    }

    #endregion

    #region GetOwnedDocuments Tests

    [Fact]
    public void GetOwnedDocuments_ShouldReturnDocuments_WhenOwnerHasDocuments()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var userId = Guid.NewGuid();
        var documents = new List<Document> { new Document { Id = 1, CreatedBy = userId } };
        mockRepo.Setup(x => x.GetOwnedDocuments(userId, null, null, null, null, null, null, null, 1, 10))
            .Returns((documents, 1));

        var result = service.GetOwnedDocuments(userId, pageNumber: 1, pageSize: 10);

        Assert.Single(result.documents);
        Assert.Equal(userId, result.documents[0].CreatedBy);
    }

    [Fact]
    public void GetOwnedDocuments_ShouldReturnEmpty_WhenOwnerHasNoDocuments()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var userId = Guid.NewGuid();
        mockRepo.Setup(x => x.GetOwnedDocuments(userId, null, null, null, null, null, null, null, 1, 10))
            .Returns((new List<Document>(), 0));

        var result = service.GetOwnedDocuments(userId, pageNumber: 1, pageSize: 10);

        Assert.Empty(result.documents);
    }

    #endregion

    #region GetManagerPublicDocuments Tests

    [Fact]
    public void GetManagerPublicDocuments_ShouldReturnDocuments_WhenDocumentsExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 1 } };
        mockRepo.Setup(x => x.GetManagerPublicDocuments(null, null, null, null, null, null, null, null, null, null, null, null, 1, 10))
            .Returns((documents, 1));

        var result = service.GetManagerPublicDocuments(pageNumber: 1, pageSize: 10);

        Assert.Single(result.documents);
    }

    [Fact]
    public void GetManagerPublicDocuments_ShouldFilterByIsApproved_WhenProvided()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 1, IsApproved = true } };
        mockRepo.Setup(x => x.GetManagerPublicDocuments(null, null, null, null, null, true, null, null, null, null, null, null, 1, 10))
            .Returns((documents, 1));

        var result = service.GetManagerPublicDocuments(isApproved: true, pageNumber: 1, pageSize: 10);

        Assert.Single(result.documents);
    }

    [Fact]
    public void GetManagerPublicDocuments_ShouldFilterByStatus_WhenProvided()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 1, Status = true } };
        mockRepo.Setup(x => x.GetManagerPublicDocuments(null, null, null, null, null, null, true, null, null, null, null, null, 1, 10))
            .Returns((documents, 1));

        var result = service.GetManagerPublicDocuments(status: true, pageNumber: 1, pageSize: 10);

        Assert.Single(result.documents);
    }

    [Fact]
    public void GetManagerPublicDocuments_ShouldFilterByDateRange_WhenProvided()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var from = DateTime.Now.AddDays(-7);
        var to = DateTime.Now;
        var documents = new List<Document> { new Document { Id = 1, CreatedAt = DateTime.Now.AddDays(-3) } };
        mockRepo.Setup(x => x.GetManagerPublicDocuments(null, null, null, null, null, null, null, null, from, to, null, null, 1, 10))
            .Returns((documents, 1));

        var result = service.GetManagerPublicDocuments(createdFrom: from, createdTo: to, pageNumber: 1, pageSize: 10);

        Assert.Single(result.documents);
    }

    #endregion

    #region GetManagerSchoolDocuments Tests

    [Fact]
    public void GetManagerSchoolDocuments_ShouldReturnDocuments_WhenDocumentsExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 1, SchoolId = 5 } };
        mockRepo.Setup(x => x.GetManagerSchoolDocuments(5, null, null, null, null, null, null, null, null, null, null, null, null, 1, 10))
            .Returns((documents, 1));

        var result = service.GetManagerSchoolDocuments(5, pageNumber: 1, pageSize: 10);

        Assert.Single(result.documents);
    }

    #endregion

    #region GetSchoolTeachersDocuments Tests

    [Fact]
    public void GetSchoolTeachersDocuments_ShouldReturnDocuments_WhenDocumentsExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var userId = Guid.NewGuid();
        var documents = new List<Document> { new Document { Id = 1, SchoolId = 5 } };
        mockRepo.Setup(x => x.GetSchoolTeachersDocuments(5, userId, null, null, null, null, null, null, null, 1, 10))
            .Returns((documents, 1));

        var result = service.GetSchoolTeachersDocuments(5, userId, pageNumber: 1, pageSize: 10);

        Assert.Single(result.documents);
    }

    #endregion

    #region RequestEditDocument Tests

    [Fact]
    public void RequestEditDocument_ShouldSetIsRequested_WhenValidRequest()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var userId = Guid.NewGuid();
        var document = new Document { Id = 1, CreatedBy = userId, IsApproved = true, IsInClass = false };
        var updatedDoc = new Document { Id = 1, CreatedBy = userId, IsApproved = true, IsRequested = true };

        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);
        mockRepo.Setup(x => x.UpdateDocument(It.IsAny<Document>())).Returns(updatedDoc);

        var result = service.RequestEditDocument(1, userId);

        Assert.True(result.IsRequested);
        mockRepo.Verify(x => x.UpdateDocument(It.IsAny<Document>()), Times.Once);
    }

    [Fact]
    public void RequestEditDocument_ShouldThrowException_WhenDocumentNotFound()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetDocumentById(999)).Returns((Document?)null);

        Assert.Throws<InvalidOperationException>(() => service.RequestEditDocument(999, Guid.NewGuid()));
    }

    [Fact]
    public void RequestEditDocument_ShouldThrowException_WhenNotOwner()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, CreatedBy = Guid.NewGuid(), IsApproved = true };
        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);

        Assert.Throws<InvalidOperationException>(() => service.RequestEditDocument(1, Guid.NewGuid()));
    }

    [Fact]
    public void RequestEditDocument_ShouldThrowException_WhenIsInClass()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var userId = Guid.NewGuid();
        var document = new Document { Id = 1, CreatedBy = userId, IsInClass = true, IsApproved = true };
        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);

        Assert.Throws<InvalidOperationException>(() => service.RequestEditDocument(1, userId));
    }

    [Fact]
    public void RequestEditDocument_ShouldThrowException_WhenNotApproved()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var userId = Guid.NewGuid();
        var document = new Document { Id = 1, CreatedBy = userId, IsInClass = false, IsApproved = false };
        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);

        Assert.Throws<InvalidOperationException>(() => service.RequestEditDocument(1, userId));
    }

    #endregion

    #region DeleteDocument Tests

    [Fact]
    public async Task DeleteDocument_ShouldReturnTrue_WhenDocumentDeleted()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, DocumentUrl = "test.pdf" };
        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);
        mockRepo.Setup(x => x.DeleteDocument(1)).Returns(true);
        mockElastic.Setup(x => x.DeleteDocumentByIdAsync(1)).ReturnsAsync(true);

        var result = await service.DeleteDocument(1);

        Assert.True(result);
        mockRepo.Verify(x => x.DeleteDocument(1), Times.Once);
    }

    [Fact]
    public async Task DeleteDocument_ShouldReturnFalse_WhenDocumentNotFound()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetDocumentById(999)).Returns((Document?)null);

        var result = await service.DeleteDocument(999);

        Assert.False(result);
    }

    #endregion

    #region SoftDeleteDocument Tests

    [Fact]
    public async Task SoftDeleteDocument_ShouldReturnTrue_WhenDocumentSoftDeleted()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, Status = true };
        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);
        mockRepo.Setup(x => x.UpdateDocument(It.IsAny<Document>())).Returns(document);
        mockElastic.Setup(x => x.UpdateDocumentStatusAsync(1, false)).ReturnsAsync(true);

        var result = await service.SoftDeleteDocument(1, Guid.NewGuid());

        Assert.True(result);
        mockRepo.Verify(x => x.UpdateDocument(It.IsAny<Document>()), Times.Once);
    }

    [Fact]
    public async Task SoftDeleteDocument_ShouldReturnFalse_WhenDocumentNotFound()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetDocumentById(999)).Returns((Document?)null);

        var result = await service.SoftDeleteDocument(999, Guid.NewGuid());

        Assert.False(result);
    }

    #endregion

    #region ApproveDocument Tests

    [Fact]
    public async Task ApproveDocument_ShouldSetIsApprovedTrue_WhenValidRequest()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, IsInClass = false, IsApproved = null };
        var approvedDoc = new Document { Id = 1, IsInClass = false, IsApproved = true };

        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);
        mockRepo.Setup(x => x.UpdateDocument(It.IsAny<Document>())).Returns(approvedDoc);
        mockElastic.Setup(x => x.UpdateDocumentUpdatedAtAsync(1, It.IsAny<DateTime>())).ReturnsAsync(true);

        var result = await service.ApproveDocument(1, Guid.NewGuid());

        Assert.True(result.IsApproved);
        mockRepo.Verify(x => x.UpdateDocument(It.IsAny<Document>()), Times.Once);
    }

    [Fact]
    public async Task ApproveDocument_ShouldThrowException_WhenDocumentNotFound()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetDocumentById(999)).Returns((Document?)null);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ApproveDocument(999, Guid.NewGuid()));
    }

    [Fact]
    public async Task ApproveDocument_ShouldThrowException_WhenIsInClass()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, IsInClass = true };
        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ApproveDocument(1, Guid.NewGuid()));
    }

    #endregion

    #region Reject[Fact]
    public async Task RejectDocument_ShouldSetIsApprovedFalse_WhenValidRequest()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, IsInClass = false, IsApproved = null };
        var rejectedDoc = new Document { Id = 1, IsInClass = false, IsApproved = false };

        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);
        mockRepo.Setup(x => x.UpdateDocument(It.IsAny<Document>())).Returns(rejectedDoc);
        mockElastic.Setup(x => x.UpdateDocumentUpdatedAtAsync(1, It.IsAny<DateTime>())).ReturnsAsync(true);

        var result = await service.RejectDocument(1, Guid.NewGuid());

        Assert.False(result.IsApproved);
        mockRepo.Verify(x => x.UpdateDocument(It.IsAny<Document>()), Times.Once);
    }

    [Fact]
    public async Task RejectDocument_ShouldThrowException_WhenDocumentNotFound()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetDocumentById(999)).Returns((Document?)null);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RejectDocument(999, Guid.NewGuid()));
    }

    [Fact]
    public async Task RejectDocument_ShouldThrowException_WhenIsInClass()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, IsInClass = true };
        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RejectDocument(1, Guid.NewGuid()));
    }

    #endregion

    #region RevokeApproval Tests

    [Fact]
    public async Task RevokeApproval_ShouldSetIsApprovedNull_WhenValidRequest()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, IsInClass = false, IsApproved = true };
        var revokedDoc = new Document { Id = 1, IsInClass = false, IsApproved = null };

        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);
        mockRepo.Setup(x => x.UpdateDocument(It.IsAny<Document>())).Returns(revokedDoc);
        mockElastic.Setup(x => x.UpdateDocumentStatusAsync(1, true)).ReturnsAsync(true);
        mockElastic.Setup(x => x.UpdateDocumentUpdatedAtAsync(1, It.IsAny<DateTime>())).ReturnsAsync(true);

        var result = await service.RevokeApproval(1, Guid.NewGuid());

        Assert.Null(result.IsApproved);
        mockRepo.Verify(x => x.UpdateDocument(It.IsAny<Document>()), Times.Once);
    }

    [Fact]
    public async Task RevokeApproval_ShouldThrowException_WhenDocumentNotFound()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetDocumentById(999)).Returns((Document?)null);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RevokeApproval(999, Guid.NewGuid()));
    }

    [Fact]
    public async Task RevokeApproval_ShouldThrowException_WhenIsInClass()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, IsInClass = true };
        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RevokeApproval(1, Guid.NewGuid()));
    }

    [Fact]
    public async Task RevokeApproval_ShouldThrowException_WhenNotApproved()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, IsInClass = false, IsApproved = false };
        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RevokeApproval(1, Guid.NewGuid()));
    }

    #endregion

    #region ToggleFeatured Tests

    [Fact]
    public async Task ToggleFeatured_ShouldToggleIsFeatured_WhenValidRequest()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, IsFeatured = false };
        var toggledDoc = new Document { Id = 1, IsFeatured = true };

        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);
        mockRepo.Setup(x => x.UpdateDocument(It.IsAny<Document>())).Returns(toggledDoc);
        mockElastic.Setup(x => x.UpdateDocumentUpdatedAtAsync(1, It.IsAny<DateTime>())).ReturnsAsync(true);

        var result = await service.ToggleFeatured(1, Guid.NewGuid());

        Assert.True(result.IsFeatured);
        mockRepo.Verify(x => x.UpdateDocument(It.IsAny<Document>()), Times.Once);
    }

    [Fact]
    public async Task ToggleFeatured_ShouldThrowException_WhenDocumentNotFound()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetDocumentById(999)).Returns((Document?)null);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ToggleFeatured(999, Guid.NewGuid()));
    }

    #endregion

    #region ApproveEditRequest Tests

    [Fact]
    public async Task ApproveEditRequest_ShouldSetIsRequestedNull_WhenValidRequest()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, IsRequested = true };
        var approvedDoc = new Document { Id = 1, IsRequested = null, IsApproved = false };

        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);
        mockRepo.Setup(x => x.UpdateDocument(It.IsAny<Document>())).Returns(approvedDoc);
        mockElastic.Setup(x => x.UpdateDocumentUpdatedAtAsync(1, It.IsAny<DateTime>())).ReturnsAsync(true);

        var result = await service.ApproveEditRequest(1, Guid.NewGuid());

        Assert.Null(result.IsRequested);
        Assert.False(result.IsApproved);
        mockRepo.Verify(x => x.UpdateDocument(It.IsAny<Document>()), Times.Once);
    }

    [Fact]
    public async Task ApproveEditRequest_ShouldThrowException_WhenDocumentNotFound()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetDocumentById(999)).Returns((Document?)null);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ApproveEditRequest(999, Guid.NewGuid()));
    }

    [Fact]
    public async Task ApproveEditRequest_ShouldThrowException_WhenNoPendingRequest()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, IsRequested = false };
        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ApproveEditRequest(1, Guid.NewGuid()));
    }

    #endregion

    #region RejectEditRequest Tests

    [Fact]
    public async Task RejectEditRequest_ShouldSetIsRequestedFalse_WhenValidRequest()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, IsRequested = true };
        var rejectedDoc = new Document { Id = 1, IsRequested = false };

        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);
        mockRepo.Setup(x => x.UpdateDocument(It.IsAny<Document>())).Returns(rejectedDoc);
        mockElastic.Setup(x => x.UpdateDocumentUpdatedAtAsync(1, It.IsAny<DateTime>())).ReturnsAsync(true);

        var result = await service.RejectEditRequest(1, Guid.NewGuid());

        Assert.False(result.IsRequested);
        mockRepo.Verify(x => x.UpdateDocument(It.IsAny<Document>()), Times.Once);
    }

    [Fact]
    public async Task RejectEditRequest_ShouldThrowException_WhenDocumentNotFound()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetDocumentById(999)).Returns((Document?)null);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RejectEditRequest(999, Guid.NewGuid()));
    }

    [Fact]
    public async Task RejectEditRequest_ShouldThrowException_WhenNoPendingRequest()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, IsRequested = false };
        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RejectEditRequest(1, Guid.NewGuid()));
    }

    #endregion

    #region GetEditRequestDocuments Tests

    [Fact]
    public void GetEditRequestDocuments_ShouldReturnDocuments_WhenRequestsExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 1, IsRequested = true } };
        mockRepo.Setup(x => x.GetEditRequestDocuments(true, 1, 10)).Returns((documents, 1));

        var result = service.GetEditRequestDocuments(isRequested: true, pageNumber: 1, pageSize: 10);

        Assert.Single(result.documents);
        Assert.True(result.documents[0].IsRequested);
    }

    [Fact]
    public void GetEditRequestDocuments_ShouldReturnEmpty_WhenNoRequestsExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetEditRequestDocuments(true, 1, 10)).Returns((new List<Document>(), 0));

        var result = service.GetEditRequestDocuments(isRequested: true, pageNumber: 1, pageSize: 10);

        Assert.Empty(result.documents);
    }

    #endregion

    #region GetDocumentsBySubject Tests

    [Fact]
    public void GetDocumentsBySubject_ShouldReturnDocuments_WhenDocumentsExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 1, SubjectId = 5 } };
        mockRepo.Setup(x => x.GetDocumentsBySubject(5)).Returns(documents);

        var result = service.GetDocumentsBySubject(5);

        Assert.Single(result);
        Assert.Equal(5, result[0].SubjectId);
    }

    [Fact]
    public void GetDocumentsBySubject_ShouldReturnEmpty_WhenNoDocumentsExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetDocumentsBySubject(999)).Returns(new List<Document>());

        var result = service.GetDocumentsBySubject(999);

        Assert.Empty(result);
    }

    #endregion

    #region GetDocumentsBySubjectForPublic Tests

    [Fact]
    public void GetDocumentsBySubjectForPublic_ShouldReturnDocuments_WhenDocumentsExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 1, SubjectId = 5, SchoolId = null } };
        mockRepo.Setup(x => x.GetDocumentsBySubjectForPublic(5)).Returns(documents);

        var result = service.GetDocumentsBySubjectForPublic(5);

        Assert.Single(result);
        Assert.Null(result[0].SchoolId);
    }

    #endregion

    #region GetDocumentsBySubjectForSchool Tests

    [Fact]
    public void GetDocumentsBySubjectForSchool_ShouldReturnDocuments_WhenDocumentsExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 1, SubjectId = 5, SchoolId = 10 } };
        mockRepo.Setup(x => x.GetDocumentsBySubjectForSchool(5, 10)).Returns(documents);

        var result = service.GetDocumentsBySubjectForSchool(5, 10);

        Assert.Single(result);
        Assert.Equal(10, result[0].SchoolId);
    }

    #endregion

    #region GetDocumentsByClass Tests

    [Fact]
    public void GetDocumentsByClass_ShouldReturnDocuments_WhenDocumentsExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var documents = new List<Document> { new Document { Id = 1 } };
        mockRepo.Setup(x => x.GetDocumentsByClass(5)).Returns(documents);

        var result = service.GetDocumentsByClass(5);

        Assert.Single(result);
    }

    [Fact]
    public void GetDocumentsByClass_ShouldReturnEmpty_WhenNoDocumentsExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetDocumentsByClass(999)).Returns(new List<Document>());

        var result = service.GetDocumentsByClass(999);

        Assert.Empty(result);
    }

    #endregion

    #region GetClassesByDocument Tests

    [Fact]
    public void GetClassesByDocument_ShouldReturnClasses_WhenClassesExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var classes = new List<Class> { new Class { Id = 1, Name = "Class A" } };
        mockRepo.Setup(x => x.GetClassesByDocument(1)).Returns(classes);

        var result = service.GetClassesByDocument(1);

        Assert.Single(result);
        Assert.Equal("Class A", result[0].Name);
    }

    [Fact]
    public void GetClassesByDocument_ShouldReturnEmpty_WhenNoClassesExist()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetClassesByDocument(999)).Returns(new List<Class>());

        var result = service.GetClassesByDocument(999);

        Assert.Empty(result);
    }

    #endregion

    #region SubmitForApproval Tests

    [Fact]
    public async Task SubmitForApproval_ShouldSetIsApprovedNull_WhenValidRequest()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var userId = Guid.NewGuid();
        var document = new Document { Id = 1, CreatedBy = userId, IsApproved = false, IsInClass = false };
        var submittedDoc = new Document { Id = 1, CreatedBy = userId, IsApproved = null };

        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);
        mockRepo.Setup(x => x.UpdateDocument(It.IsAny<Document>())).Returns(submittedDoc);
        mockElastic.Setup(x => x.UpdateDocumentUpdatedAtAsync(1, It.IsAny<DateTime>())).ReturnsAsync(true);

        var result = await service.SubmitForApproval(1, userId);

        Assert.Null(result.IsApproved);
        mockRepo.Verify(x => x.UpdateDocument(It.IsAny<Document>()), Times.Once);
    }

    [Fact]
    public async Task SubmitForApproval_ShouldThrowException_WhenDocumentNotFound()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetDocumentById(999)).Returns((Document?)null);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.SubmitForApproval(999, Guid.NewGuid()));
    }

    [Fact]
    public async Task SubmitForApproval_ShouldThrowException_WhenNotOwner()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, CreatedBy = Guid.NewGuid(), IsApproved = false };
        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.SubmitForApproval(1, Guid.NewGuid()));
    }

    [Fact]
    public async Task SubmitForApproval_ShouldThrowException_WhenIsInClass()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var userId = Guid.NewGuid();
        var document = new Document { Id = 1, CreatedBy = userId, IsInClass = true, IsApproved = false };
        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.SubmitForApproval(1, userId));
    }

    [Fact]
    public async Task SubmitForApproval_ShouldThrowException_WhenAlreadyApproved()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var userId = Guid.NewGuid();
        var document = new Document { Id = 1, CreatedBy = userId, IsInClass = false, IsApproved = true };
        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.SubmitForApproval(1, userId));
    }

    #endregion

    #region CancelEditRequest Tests

    [Fact]
    public async Task CancelEditRequest_ShouldSetIsRequestedNull_WhenValidRequest()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var userId = Guid.NewGuid();
        var document = new Document { Id = 1, CreatedBy = userId, IsRequested = true };
        var cancelledDoc = new Document { Id = 1, CreatedBy = userId, IsRequested = null, IsApproved = false };

        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);
        mockRepo.Setup(x => x.UpdateDocument(It.IsAny<Document>())).Returns(cancelledDoc);
        mockElastic.Setup(x => x.UpdateDocumentUpdatedAtAsync(1, It.IsAny<DateTime>())).ReturnsAsync(true);

        var result = await service.CancelEditRequest(1, userId);

        Assert.Null(result.IsRequested);
        Assert.False(result.IsApproved);
        mockRepo.Verify(x => x.UpdateDocument(It.IsAny<Document>()), Times.Once);
    }

    [Fact]
    public async Task CancelEditRequest_ShouldThrowException_WhenDocumentNotFound()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        mockRepo.Setup(x => x.GetDocumentById(999)).Returns((Document?)null);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CancelEditRequest(999, Guid.NewGuid()));
    }

    [Fact]
    public async Task CancelEditRequest_ShouldThrowException_WhenNotOwner()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var document = new Document { Id = 1, CreatedBy = Guid.NewGuid(), IsRequested = true };
        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CancelEditRequest(1, Guid.NewGuid()));
    }

    [Fact]
    public async Task CancelEditRequest_ShouldThrowException_WhenNoPendingRequest()
    {
        var mockRepo = new Mock<IDocumentRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockElastic = new Mock<ElasticDocumentVectorSearchService>();
        var service = new DocumentService(mockRepo.Object, mockFileStorage.Object, mockElastic.Object);

        var userId = Guid.NewGuid();
        var document = new Document { Id = 1, CreatedBy = userId, IsRequested = false };
        mockRepo.Setup(x => x.GetDocumentById(1)).Returns(document);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CancelEditRequest(1, userId));
    }

    #endregion
}