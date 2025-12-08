using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class DocumentCategoryServiceTests
{
    #region GetDocumentCategories Tests

    [Fact]
    public void GetDocumentCategories_ShouldReturnAllCategories_WhenCategoriesExist()
    {
        var mockRepo = new Mock<IDocumentCategoryRepository>();
        var service = new DocumentCategoryService(mockRepo.Object);

        var categories = new List<DocumentCategory>
        {
            new DocumentCategory { Id = 1, Name = "Lecture Notes", Description = "Class lecture notes" },
            new DocumentCategory { Id = 2, Name = "Assignments", Description = "Student assignments" },
            new DocumentCategory { Id = 3, Name = "Exams", Description = "Test papers" }
        };

        mockRepo.Setup(x => x.GetAllDocumentCategories()).Returns(categories);

        var result = service.GetDocumentCategories();

        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.Equal("Lecture Notes", result[0].Name);
        Assert.Equal("Assignments", result[1].Name);
        Assert.Equal("Exams", result[2].Name);
        mockRepo.Verify(x => x.GetAllDocumentCategories(), Times.Once);
    }

    [Fact]
    public void GetDocumentCategories_ShouldReturnEmptyList_WhenNoCategoriesExist()
    {
        var mockRepo = new Mock<IDocumentCategoryRepository>();
        var service = new DocumentCategoryService(mockRepo.Object);

        mockRepo.Setup(x => x.GetAllDocumentCategories()).Returns(new List<DocumentCategory>());

        var result = service.GetDocumentCategories();

        Assert.NotNull(result);
        Assert.Empty(result);
        mockRepo.Verify(x => x.GetAllDocumentCategories(), Times.Once);
    }

    [Fact]
    public void GetDocumentCategories_ShouldReturnCategoriesWithCorrectProperties_WhenCalled()
    {
        var mockRepo = new Mock<IDocumentCategoryRepository>();
        var service = new DocumentCategoryService(mockRepo.Object);

        var categories = new List<DocumentCategory>
        {
            new DocumentCategory { Id = 1, Name = "Test Category", Description = "Test Description" }
        };

        mockRepo.Setup(x => x.GetAllDocumentCategories()).Returns(categories);

        var result = service.GetDocumentCategories();

        Assert.Single(result);
        Assert.Equal(1, result[0].Id);
        Assert.Equal("Test Category", result[0].Name);
        Assert.Equal("Test Description", result[0].Description);
    }

    [Fact]
    public void GetDocumentCategories_ShouldHandleMultipleCategories_WhenCalled()
    {
        var mockRepo = new Mock<IDocumentCategoryRepository>();
        var service = new DocumentCategoryService(mockRepo.Object);

        var categories = new List<DocumentCategory>();
        for (int i = 1; i <= 10; i++)
        {
            categories.Add(new DocumentCategory { Id = (sbyte)i, Name = $"Category {i}" });
        }

        mockRepo.Setup(x => x.GetAllDocumentCategories()).Returns(categories);

        var result = service.GetDocumentCategories();

        Assert.Equal(10, result.Count);
        mockRepo.Verify(x => x.GetAllDocumentCategories(), Times.Once);
    }

    [Fact]
    public void GetDocumentCategories_ShouldCallRepositoryOnce_WhenCalled()
    {
        var mockRepo = new Mock<IDocumentCategoryRepository>();
        var service = new DocumentCategoryService(mockRepo.Object);

        mockRepo.Setup(x => x.GetAllDocumentCategories()).Returns(new List<DocumentCategory>());

        service.GetDocumentCategories();

        mockRepo.Verify(x => x.GetAllDocumentCategories(), Times.Once);
    }

    #endregion

    #region GetDocumentCategory Tests

    [Fact]
    public void GetDocumentCategory_ShouldReturnCategory_WhenCategoryExists()
    {
        var mockRepo = new Mock<IDocumentCategoryRepository>();
        var service = new DocumentCategoryService(mockRepo.Object);

        var category = new DocumentCategory { Id = 1, Name = "Lecture Notes", Description = "Class notes" };
        mockRepo.Setup(x => x.GetDocumentCategoryById(1)).Returns(category);

        var result = service.GetDocumentCategory(1);

        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("Lecture Notes", result.Name);
        Assert.Equal("Class notes", result.Description);
        mockRepo.Verify(x => x.GetDocumentCategoryById(1), Times.Once);
    }

    [Fact]
    public void GetDocumentCategory_ShouldReturnNull_WhenCategoryDoesNotExist()
    {
        var mockRepo = new Mock<IDocumentCategoryRepository>();
        var service = new DocumentCategoryService(mockRepo.Object);

        mockRepo.Setup(x => x.GetDocumentCategoryById(999)).Returns((DocumentCategory?)null);

        var result = service.GetDocumentCategory(999);

        Assert.Null(result);
        mockRepo.Verify(x => x.GetDocumentCategoryById(999), Times.Once);
    }

    [Fact]
    public void GetDocumentCategory_ShouldHandleDifferentIds_WhenCalled()
    {
        var mockRepo = new Mock<IDocumentCategoryRepository>();
        var service = new DocumentCategoryService(mockRepo.Object);

        var category1 = new DocumentCategory { Id = 1, Name = "Category 1" };
        var category2 = new DocumentCategory { Id = 2, Name = "Category 2" };

        mockRepo.Setup(x => x.GetDocumentCategoryById(1)).Returns(category1);
        mockRepo.Setup(x => x.GetDocumentCategoryById(2)).Returns(category2);

        var result1 = service.GetDocumentCategory(1);
        var result2 = service.GetDocumentCategory(2);

        Assert.NotNull(result1);
        Assert.NotNull(result2);
        Assert.Equal("Category 1", result1.Name);
        Assert.Equal("Category 2", result2.Name);
    }

    [Fact]
    public void GetDocumentCategory_ShouldReturnCategoryWithAllProperties_WhenExists()
    {
        var mockRepo = new Mock<IDocumentCategoryRepository>();
        var service = new DocumentCategoryService(mockRepo.Object);

        var category = new DocumentCategory
        {
            Id = 5,
            Name = "Test Category",
            Description = "Full description here"
        };
        mockRepo.Setup(x => x.GetDocumentCategoryById(5)).Returns(category);

        var result = service.GetDocumentCategory(5);

        Assert.NotNull(result);
        Assert.Equal(5, result.Id);
        Assert.Equal("Test Category", result.Name);
        Assert.Equal("Full description here", result.Description);
    }

    [Fact]
    public void GetDocumentCategory_ShouldCallRepositoryOnce_WhenCalled()
    {
        var mockRepo = new Mock<IDocumentCategoryRepository>();
        var service = new DocumentCategoryService(mockRepo.Object);

        mockRepo.Setup(x => x.GetDocumentCategoryById(1)).Returns(new DocumentCategory());

        service.GetDocumentCategory(1);

        mockRepo.Verify(x => x.GetDocumentCategoryById(1), Times.Once);
    }

    #endregion

    #region CreateDocumentCategory Tests

    [Fact]
    public void CreateDocumentCategory_ShouldReturnCreatedCategory_WhenValidDataProvided()
    {
        var mockRepo = new Mock<IDocumentCategoryRepository>();
        var service = new DocumentCategoryService(mockRepo.Object);

        var newCategory = new DocumentCategory
        {
            Name = "New Category",
            Description = "New Description"
        };
        var createdCategory = new DocumentCategory
        {
            Id = 1,
            Name = "New Category",
            Description = "New Description"
        };

        mockRepo.Setup(x => x.CreateDocumentCategory(newCategory)).Returns(createdCategory);

        var result = service.CreateDocumentCategory(newCategory);

        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("New Category", result.Name);
        Assert.Equal("New Description", result.Description);
        mockRepo.Verify(x => x.CreateDocumentCategory(newCategory), Times.Once);
    }

    [Fact]
    public void CreateDocumentCategory_ShouldAssignId_WhenCategoryCreated()
    {
        var mockRepo = new Mock<IDocumentCategoryRepository>();
        var service = new DocumentCategoryService(mockRepo.Object);

        var newCategory = new DocumentCategory { Name = "Test" };
        var createdCategory = new DocumentCategory { Id = 10, Name = "Test" };

        mockRepo.Setup(x => x.CreateDocumentCategory(newCategory)).Returns(createdCategory);

        var result = service.CreateDocumentCategory(newCategory);

        Assert.Equal(10, result.Id);
        Assert.Equal("Test", result.Name);
    }

    [Fact]
    public void CreateDocumentCategory_ShouldHandleMultipleCreations_WhenCalled()
    {
        var mockRepo = new Mock<IDocumentCategoryRepository>();
        var service = new DocumentCategoryService(mockRepo.Object);

        var category1 = new DocumentCategory { Name = "Category 1" };
        var category2 = new DocumentCategory { Name = "Category 2" };

        mockRepo.Setup(x => x.CreateDocumentCategory(It.IsAny<DocumentCategory>()))
            .Returns((DocumentCategory c) => new DocumentCategory
            {
                Id = 1,
                Name = c.Name,
                Description = c.Description
            });

        var result1 = service.CreateDocumentCategory(category1);
        var result2 = service.CreateDocumentCategory(category2);

        Assert.NotNull(result1);
        Assert.NotNull(result2);
        Assert.Equal("Category 1", result1.Name);
        Assert.Equal("Category 2", result2.Name);
        mockRepo.Verify(x => x.CreateDocumentCategory(It.IsAny<DocumentCategory>()), Times.Exactly(2));
    }

    [Fact]
    public void CreateDocumentCategory_ShouldPreserveAllProperties_WhenCreated()
    {
        var mockRepo = new Mock<IDocumentCategoryRepository>();
        var service = new DocumentCategoryService(mockRepo.Object);

        var newCategory = new DocumentCategory
        {
            Name = "Complete Category",
            Description = "Complete Description"
        };
        var createdCategory = new DocumentCategory
        {
            Id = 5,
            Name = "Complete Category",
            Description = "Complete Description"
        };

        mockRepo.Setup(x => x.CreateDocumentCategory(newCategory)).Returns(createdCategory);

        var result = service.CreateDocumentCategory(newCategory);

        Assert.Equal(5, result.Id);
        Assert.Equal("Complete Category", result.Name);
        Assert.Equal("Complete Description", result.Description);
    }

    [Fact]
    public void CreateDocumentCategory_ShouldCallRepositoryOnce_WhenCalled()
    {
        var mockRepo = new Mock<IDocumentCategoryRepository>();
        var service = new DocumentCategoryService(mockRepo.Object);

        var category = new DocumentCategory { Name = "Test" };
        mockRepo.Setup(x => x.CreateDocumentCategory(category)).Returns(category);

        service.CreateDocumentCategory(category);

        mockRepo.Verify(x => x.CreateDocumentCategory(category), Times.Once);
    }

    [Fact]
    public void CreateDocumentCategory_ShouldHandleCategoryWithoutDescription_WhenProvided()
    {
        var mockRepo = new Mock<IDocumentCategoryRepository>();
        var service = new DocumentCategoryService(mockRepo.Object);

        var newCategory = new DocumentCategory { Name = "No Description Category" };
        var createdCategory = new DocumentCategory { Id = 1, Name = "No Description Category" };

        mockRepo.Setup(x => x.CreateDocumentCategory(newCategory)).Returns(createdCategory);

        var result = service.CreateDocumentCategory(newCategory);

        Assert.NotNull(result);
        Assert.Equal("No Description Category", result.Name);
        Assert.Null(result.Description);
    }

    #endregion
}