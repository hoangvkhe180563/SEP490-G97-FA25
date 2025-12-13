using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;
using Xunit;
using System;
using System.Threading.Tasks;
using Moq.Language.Flow;
using System.Collections.Generic;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class CourseServiceTests
{
    private readonly Mock<ICourseRepository> _mockCourseRepo;
    private readonly Mock<ElasticCourseVectorSearchService> _mockElasticVectorService;
    private readonly Mock<IElasticSearchCourse> _mockElasticSearchCourseRepo;
    // embedding service is not mocked; we mock the elastic vector service interface instead
    private readonly CourseService _service;

    public CourseServiceTests()
    {
        _mockCourseRepo = new Mock<ICourseRepository>();
        _mockElasticSearchCourseRepo = new Mock<IElasticSearchCourse>();
        _mockElasticVectorService = new Mock<ElasticCourseVectorSearchService>();

        _service = new CourseService(
            _mockCourseRepo.Object,
            _mockElasticVectorService.Object,
            _mockElasticSearchCourseRepo.Object
        );
    }

    // --------------------- CreateCourse tests ---------------------

    [Fact]
    public async Task CreateCourse_ShouldCallRepo_AndIndexElastic_WhenAllSucceeds()
    {
        var input = new Course { Id = 0, Name = "C# Basics", Status = "Mở" };
        var created = new Course { Id = 11, Name = "C# Basics", Status = "Mở" };

        _mockCourseRepo.Setup(x => x.CreateCourse(input)).Returns(created);
        _mockElasticVectorService.Setup(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>())).ReturnsAsync(true);
        _mockElasticSearchCourseRepo.Setup(x => x.IndexCourseAsync(It.IsAny<Course>(), It.IsAny<string>(), It.IsAny<float[]>())).ReturnsAsync(true);

        var result = await _service.CreateCourse(input);

        Assert.Equal(created, result);
        _mockCourseRepo.Verify(x => x.CreateCourse(input), Times.Once);
        _mockElasticVectorService.Verify(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>()), Times.Once);
    }

    [Fact]
    public async Task CreateCourse_ShouldThrow_WhenElasticIndexFails()
    {
        var input = new Course { Id = 0, Name = "C# Advanced", Status = "Mở" };
        var created = new Course { Id = 22, Name = "C# Advanced", Status = "Mở" };

        _mockCourseRepo.Setup(x => x.CreateCourse(input)).Returns(created);
        _mockElasticVectorService.Setup(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>())).ReturnsAsync(false);
        _mockElasticSearchCourseRepo.Setup(x => x.IndexCourseAsync(It.IsAny<Course>(), It.IsAny<string>(), It.IsAny<float[]>())).ReturnsAsync(false);

        await Assert.ThrowsAsync<Exception>(() => _service.CreateCourse(input));
        _mockCourseRepo.Verify(x => x.CreateCourse(input), Times.Once);
        _mockElasticVectorService.Verify(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>()), Times.Once);
    }

    [Fact]
    public async Task CreateCourse_ShouldReturnCreatedCourseProperties()
    {
        var input = new Course { Id = 0, Name = "Math 101", Status = "Mở", Price = 100 };
        var created = new Course { Id = 33, Name = "Math 101", Status = "Mở", Price = 100 };

        _mockCourseRepo.Setup(x => x.CreateCourse(input)).Returns(created);
        _mockElasticVectorService.Setup(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>())).ReturnsAsync(true);
        _mockElasticSearchCourseRepo.Setup(x => x.IndexCourseAsync(It.IsAny<Course>(), It.IsAny<string>(), It.IsAny<float[]>())).ReturnsAsync(true);

        var result = await _service.CreateCourse(input);

        Assert.Equal(33, result.Id);
        Assert.Equal((uint)100, result.Price);
    }

    [Fact]
    public async Task CreateCourse_ShouldCallIndexWithCorrectId()
    {
        var input = new Course { Id = 0, Name = "Physics", Status = "Mở" };
        var created = new Course { Id = 44, Name = "Physics", Status = "Mở" };

        _mockCourseRepo.Setup(x => x.CreateCourse(input)).Returns(created);
        _mockElasticVectorService.Setup(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>())).ReturnsAsync(true);
        _mockElasticSearchCourseRepo.Setup(x => x.IndexCourseAsync(It.IsAny<Course>(), It.IsAny<string>(), It.IsAny<float[]>())).ReturnsAsync(true);

        var result = await _service.CreateCourse(input);

        _mockElasticVectorService.Verify(x => x.IndexCourseAsync(It.Is<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>(r => r.Id == 44 && r.Name == "Physics")), Times.Once);
    }

    [Fact]
    public async Task CreateCourse_ShouldThrow_WhenRepoReturnsNullLikeCourseHasNoId()
    {
        var input = new Course { Id = 0, Name = "Empty" };
        _mockCourseRepo.Setup(x => x.CreateCourse(input)).Returns((Course)null!);
        _mockElasticVectorService.Setup(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>())).ReturnsAsync(true);
        _mockElasticSearchCourseRepo.Setup(x => x.IndexCourseAsync(It.IsAny<Course>(), It.IsAny<string>(), It.IsAny<float[]>())).ReturnsAsync(true);

        await Assert.ThrowsAsync<NullReferenceException>(async () => await _service.CreateCourse(input));
    }

    [Fact]
    public async Task CreateCourse_ShouldCallIndexEvenIfOptionalFieldsMissing()
    {
        var input = new Course { Id = 0, Name = "NoInfo", Status = "Mở" };
        var created = new Course { Id = 55, Name = "NoInfo", Status = "Mở", Information = null };

        _mockCourseRepo.Setup(x => x.CreateCourse(input)).Returns(created);
        _mockElasticVectorService.Setup(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>())).ReturnsAsync(true);
        _mockElasticSearchCourseRepo.Setup(x => x.IndexCourseAsync(It.IsAny<Course>(), It.IsAny<string>(), It.IsAny<float[]>())).ReturnsAsync(true);

        var result = await _service.CreateCourse(input);

        Assert.Equal(55, result.Id);
    }

    [Fact]
    public async Task CreateCourse_ShouldNotIndex_WhenRepoThrows()
    {
        var input = new Course { Id = 0, Name = "WillFail" };
        _mockCourseRepo.Setup(x => x.CreateCourse(input)).Throws(new Exception("DB error"));

        await Assert.ThrowsAsync<Exception>(() => _service.CreateCourse(input));
        _mockElasticVectorService.Verify(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>()), Times.Never);
    }

    [Fact]
    public async Task CreateCourse_ShouldHandleDifferentStatuses()
    {
        var input = new Course { Id = 0, Name = "DraftCourse", Status = "Nháp" };
        var created = new Course { Id = 66, Name = "DraftCourse", Status = "Nháp" };

        _mockCourseRepo.Setup(x => x.CreateCourse(input)).Returns(created);
        _mockElasticVectorService.Setup(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>())).ReturnsAsync(true);
        _mockElasticSearchCourseRepo.Setup(x => x.IndexCourseAsync(It.IsAny<Course>(), It.IsAny<string>(), It.IsAny<float[]>())).ReturnsAsync(true);

        var result = await _service.CreateCourse(input);
        Assert.Equal("Nháp", result.Status);
    }

    [Fact]
    public async Task CreateCourse_ShouldCallRepoExactlyOnce_PerCall()
    {
        var input = new Course { Id = 0, Name = "OnceOnly" };
        var created = new Course { Id = 77, Name = "OnceOnly" };

        _mockCourseRepo.Setup(x => x.CreateCourse(input)).Returns(created);
        _mockElasticVectorService.Setup(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>())).ReturnsAsync(true);
        _mockElasticSearchCourseRepo.Setup(x => x.IndexCourseAsync(It.IsAny<Course>(), It.IsAny<string>(), It.IsAny<float[]>())).ReturnsAsync(true);

        await _service.CreateCourse(input);
        _mockCourseRepo.Verify(x => x.CreateCourse(input), Times.Once);
    }

    // --------------------- UpdateCourse tests ---------------------

    [Fact]
    public async Task UpdateCourse_ShouldThrow_WhenOldCourseNotFound()
    {
        var input = new Course { Id = 999, Name = "NonExist" };
        _mockCourseRepo.Setup(x => x.GetCourseById(input.Id)).Returns((Course?)null);
        _mockCourseRepo.Setup(x => x.UpdateCourse(input)).Returns(input);

        await Assert.ThrowsAsync<Exception>(() => _service.UpdateCourse(input));
    }

    [Fact]
    public async Task UpdateCourse_ShouldCallUpdateRepo_AndIndexElastic_WhenStatusUnchanged_AndIndexSucceeds()
    {
        var input = new Course { Id = 101, Name = "Upd1", Status = "Mở" };
        var old = new Course { Id = 101, Name = "Upd1", Status = "Mở" };
        var updated = new Course { Id = 101, Name = "Upd1 Edited", Status = "Mở" };

        _mockCourseRepo.Setup(x => x.GetCourseById(input.Id)).Returns(old);
        _mockCourseRepo.Setup(x => x.UpdateCourse(input)).Returns(updated);
        _mockElasticVectorService.Setup(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>())).ReturnsAsync(true);
        _mockElasticSearchCourseRepo.Setup(x => x.IndexCourseAsync(It.IsAny<Course>(), It.IsAny<string>(), It.IsAny<float[]>())).ReturnsAsync(true);

        var result = await _service.UpdateCourse(input);

        Assert.Equal(updated, result);
        _mockCourseRepo.Verify(x => x.UpdateCourse(input), Times.Once);
        _mockElasticVectorService.Verify(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>()), Times.Once);
    }

    [Fact]
    public async Task UpdateCourse_ShouldThrow_WhenIndexFails_ForStatusUnchanged()
    {
        var input = new Course { Id = 102, Name = "UpdFail", Status = "Mở" };
        var old = new Course { Id = 102, Name = "UpdFail", Status = "Mở" };
        var updated = new Course { Id = 102, Name = "UpdFail", Status = "Mở" };

        _mockCourseRepo.Setup(x => x.GetCourseById(input.Id)).Returns(old);
        _mockCourseRepo.Setup(x => x.UpdateCourse(input)).Returns(updated);
        _mockElasticVectorService.Setup(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>())).ReturnsAsync(false);
        _mockElasticSearchCourseRepo.Setup(x => x.IndexCourseAsync(It.IsAny<Course>(), It.IsAny<string>(), It.IsAny<float[]>())).ReturnsAsync(false);

        await Assert.ThrowsAsync<Exception>(() => _service.UpdateCourse(input));
    }

    [Fact]
    public async Task UpdateCourse_ShouldCallUpdateCourseStatus_WhenStatusChanged()
    {
        var input = new Course { Id = 103, Name = "StatusChange", Status = "Đóng" };
        var old = new Course { Id = 103, Name = "StatusChange", Status = "Mở" };
        var updated = new Course { Id = 103, Name = "StatusChange", Status = "Đóng" };

        _mockCourseRepo.Setup(x => x.GetCourseById(input.Id)).Returns(old);
        _mockCourseRepo.Setup(x => x.UpdateCourse(input)).Returns(updated);
        _mockElasticSearchCourseRepo.Setup(x => x.UpdateCourseStatusAsync(input.Id, input.Status)).ReturnsAsync(true);

        var result = await _service.UpdateCourse(input);

        _mockElasticSearchCourseRepo.Verify(x => x.UpdateCourseStatusAsync(input.Id, input.Status), Times.Once);
        Assert.Equal(updated, result);
    }

    [Fact]
    public async Task UpdateCourse_ShouldNotCallStatusUpdate_WhenStatusUnchanged()
    {
        var input = new Course { Id = 104, Name = "NoStatusChange", Status = "Mở" };
        var old = new Course { Id = 104, Name = "NoStatusChange", Status = "Mở" };
        var updated = new Course { Id = 104, Name = "NoStatusChange", Status = "Mở" };

        _mockCourseRepo.Setup(x => x.GetCourseById(input.Id)).Returns(old);
        _mockCourseRepo.Setup(x => x.UpdateCourse(input)).Returns(updated);
        _mockElasticVectorService.Setup(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>())).ReturnsAsync(true);
        _mockElasticSearchCourseRepo.Setup(x => x.IndexCourseAsync(It.IsAny<Course>(), It.IsAny<string>(), It.IsAny<float[]>())).ReturnsAsync(true);

        var result = await _service.UpdateCourse(input);

        _mockElasticSearchCourseRepo.Verify(x => x.UpdateCourseStatusAsync(It.IsAny<int>(), It.IsAny<string>()), Times.Never);
        _mockElasticVectorService.Verify(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>()), Times.Once);
    }

    [Fact]
    public async Task UpdateCourse_ShouldThrow_WhenElasticStatusUpdateFails()
    {
        var input = new Course { Id = 105, Name = "StatusFail", Status = "Đóng" };
        var old = new Course { Id = 105, Name = "StatusFail", Status = "Mở" };
        var updated = new Course { Id = 105, Name = "StatusFail", Status = "Đóng" };

        _mockCourseRepo.Setup(x => x.GetCourseById(input.Id)).Returns(old);
        _mockCourseRepo.Setup(x => x.UpdateCourse(input)).Returns(updated);
        _mockElasticSearchCourseRepo.Setup(x => x.UpdateCourseStatusAsync(input.Id, input.Status)).ReturnsAsync(false);

        var result = await _service.UpdateCourse(input);
        Assert.Equal(updated, result);
        _mockElasticSearchCourseRepo.Verify(x => x.UpdateCourseStatusAsync(input.Id, input.Status), Times.Once);
    }

    [Fact]
    public async Task UpdateCourse_ShouldReturnUpdatedCourse_WhenEverythingSucceeds()
    {
        var input = new Course { Id = 106, Name = "FinalUpdate", Status = "Mở" };
        var old = new Course { Id = 106, Name = "FinalUpdate", Status = "Mở" };
        var updated = new Course { Id = 106, Name = "FinalUpdate Edited", Status = "Mở" };

        _mockCourseRepo.Setup(x => x.GetCourseById(input.Id)).Returns(old);
        _mockCourseRepo.Setup(x => x.UpdateCourse(input)).Returns(updated);
        _mockElasticVectorService.Setup(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>())).ReturnsAsync(true);
        _mockElasticSearchCourseRepo.Setup(x => x.IndexCourseAsync(It.IsAny<Course>(), It.IsAny<string>(), It.IsAny<float[]>())).ReturnsAsync(true);

        var result = await _service.UpdateCourse(input);

        Assert.Equal(updated.Name, result.Name);
    }

    [Fact]
    public async Task UpdateCourse_ShouldIndexWithCorrectId_WhenStatusUnchanged()
    {
        var input = new Course { Id = 107, Name = "IndexCheck", Status = "Mở" };
        var old = new Course { Id = 107, Name = "IndexCheck", Status = "Mở" };
        var updated = new Course { Id = 107, Name = "IndexCheck Updated", Status = "Mở" };

        _mockCourseRepo.Setup(x => x.GetCourseById(input.Id)).Returns(old);
        _mockCourseRepo.Setup(x => x.UpdateCourse(input)).Returns(updated);
        _mockElasticVectorService.Setup(x => x.IndexCourseAsync(It.IsAny<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>())).ReturnsAsync(true);
        _mockElasticSearchCourseRepo.Setup(x => x.IndexCourseAsync(It.IsAny<Course>(), It.IsAny<string>(), It.IsAny<float[]>())).ReturnsAsync(true);

        var result = await _service.UpdateCourse(input);

        _mockElasticVectorService.Verify(x => x.IndexCourseAsync(It.Is<StudyHub.Backend.UseCases.Dtos.UpsertElasticCourseRequest>(r => r.Id == 107)), Times.Once);
    }

}
