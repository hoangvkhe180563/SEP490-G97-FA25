using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class CourseServiceTests
{
    #region GetAllCourses Tests

    [Fact]
    public void GetAllCourses_ShouldReturnPagedResult_WhenCoursesExist()
    {
        // Arrange
        var mockCourseRepository = new Mock<ICourseRepository>();
        var mockElasticSearchCourse = new Mock<IElasticSearchCourse>();

        var courseService = new CourseService(
            mockCourseRepository.Object,
            null!, // Not used in GetAllCourses
            mockElasticSearchCourse.Object
        );

        var queryParams = new CourseQueryParams
        {
            Page = 1,
            PageSize = 5
        };

        var courses = new List<Course>
        {
            new Course
            {
                Id = 1,
                Name = "C# Programming",
                Information = "Learn C# basics",
                Price = 100,
                Grade = 10,
                SubjectId = 1,
                Status = "Active",
                StartAt = DateTime.Now,
                EndAt = DateTime.Now.AddMonths(3)
            },
            new Course
            {
                Id = 2,
                Name = "ASP.NET Core",
                Information = "Learn ASP.NET Core",
                Price = 200,
                Grade = 11,
                SubjectId = 1,
                Status = "Active",
                StartAt = DateTime.Now,
                EndAt = DateTime.Now.AddMonths(4)
            }
        };

        var pagedResult = new PagedResult<Course>
        {
            Items = courses,
            Total = 2,
            Page = 1,
            Limit = 5,
            TotalPages = 1
        };

        mockCourseRepository.Setup(x => x.GetAllCourses(queryParams))
            .Returns(pagedResult);

        // Act
        var result = courseService.GetAllCourses(queryParams);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Total);
        Assert.Equal(2, result.Items.Count);
        Assert.Equal("C# Programming", result.Items[0].Name);
        Assert.Equal("ASP.NET Core", result.Items[1].Name);
        mockCourseRepository.Verify(x => x.GetAllCourses(queryParams), Times.Once);
    }

    [Fact]
    public void GetAllCourses_ShouldReturnEmptyPagedResult_WhenNoCoursesExist()
    {
        // Arrange
        var mockCourseRepository = new Mock<ICourseRepository>();
        var mockElasticSearchCourse = new Mock<IElasticSearchCourse>();

        var courseService = new CourseService(
            mockCourseRepository.Object,
            null!,
            mockElasticSearchCourse.Object
        );

        var queryParams = new CourseQueryParams
        {
            Page = 1,
            PageSize = 5
        };

        var pagedResult = new PagedResult<Course>
        {
            Items = new List<Course>(),
            Total = 0,
            Page = 1,
            Limit = 5,
            TotalPages = 0
        };

        mockCourseRepository.Setup(x => x.GetAllCourses(queryParams))
            .Returns(pagedResult);

        // Act
        var result = courseService.GetAllCourses(queryParams);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(0, result.Total);
        Assert.Empty(result.Items);
        mockCourseRepository.Verify(x => x.GetAllCourses(queryParams), Times.Once);
    }

    [Fact]
    public void GetAllCourses_ShouldFilterBySubject_WhenSubjectIdProvided()
    {
        // Arrange
        var mockCourseRepository = new Mock<ICourseRepository>();
        var mockElasticSearchCourse = new Mock<IElasticSearchCourse>();

        var courseService = new CourseService(
            mockCourseRepository.Object,
            null!,
            mockElasticSearchCourse.Object
        );

        var queryParams = new CourseQueryParams
        {
            SubjectId = 1,
            Page = 1,
            PageSize = 5
        };

        var courses = new List<Course>
        {
            new Course
            {
                Id = 1,
                Name = "C# Programming",
                SubjectId = 1,
                Status = "Active",
                Grade = 10,
                Price = 100,
                StartAt = DateTime.Now,
                EndAt = DateTime.Now.AddMonths(3)
            }
        };

        var pagedResult = new PagedResult<Course>
        {
            Items = courses,
            Total = 1,
            Page = 1,
            Limit = 5,
            TotalPages = 1
        };

        mockCourseRepository.Setup(x => x.GetAllCourses(queryParams))
            .Returns(pagedResult);

        // Act
        var result = courseService.GetAllCourses(queryParams);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.Items);
        Assert.Equal(1, result.Items[0].SubjectId);
        mockCourseRepository.Verify(x => x.GetAllCourses(queryParams), Times.Once);
    }

    #endregion

    #region GetCourse Tests

    [Fact]
    public void GetCourse_ShouldReturnCourse_WhenCourseExists()
    {
        // Arrange
        var mockCourseRepository = new Mock<ICourseRepository>();
        var mockElasticSearchCourse = new Mock<IElasticSearchCourse>();

        var courseService = new CourseService(
            mockCourseRepository.Object,
            null!,
            mockElasticSearchCourse.Object
        );

        var courseId = 1;
        var course = new Course
        {
            Id = courseId,
            Name = "C# Programming",
            Information = "Learn C# basics",
            Price = 100,
            Grade = 10,
            SubjectId = 1,
            Status = "Active",
            StartAt = DateTime.Now,
            EndAt = DateTime.Now.AddMonths(3)
        };

        mockCourseRepository.Setup(x => x.GetCourseById(courseId))
            .Returns(course);

        // Act
        var result = courseService.GetCourse(courseId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(courseId, result.Id);
        Assert.Equal("C# Programming", result.Name);
        mockCourseRepository.Verify(x => x.GetCourseById(courseId), Times.Once);
    }

    [Fact]
    public void GetCourse_ShouldReturnNull_WhenCourseDoesNotExist()
    {
        // Arrange
        var mockCourseRepository = new Mock<ICourseRepository>();
        var mockElasticSearchCourse = new Mock<IElasticSearchCourse>();

        var courseService = new CourseService(
            mockCourseRepository.Object,
            null!,
            mockElasticSearchCourse.Object
        );

        var courseId = 999;
        mockCourseRepository.Setup(x => x.GetCourseById(courseId))
            .Returns((Course?)null);

        // Act
        var result = courseService.GetCourse(courseId);

        // Assert
        Assert.Null(result);
        mockCourseRepository.Verify(x => x.GetCourseById(courseId), Times.Once);
    }

    #endregion

    #region GetCourseBySchool Tests

    [Fact]
    public void GetCourseBySchool_ShouldReturnCourses_WhenCoursesExistForSchool()
    {
        // Arrange
        var mockCourseRepository = new Mock<ICourseRepository>();
        var mockElasticSearchCourse = new Mock<IElasticSearchCourse>();

        var courseService = new CourseService(
            mockCourseRepository.Object,
            null!,
            mockElasticSearchCourse.Object
        );

        var schoolId = 1;
        var courses = new List<Course>
        {
            new Course
            {
                Id = 1,
                Name = "School Course 1",
                SchoolId = schoolId,
                Status = "Active",
                Grade = 10,
                SubjectId = 1,
                Price = 100,
                StartAt = DateTime.Now,
                EndAt = DateTime.Now.AddMonths(3)
            },
            new Course
            {
                Id = 2,
                Name = "School Course 2",
                SchoolId = schoolId,
                Status = "Active",
                Grade = 11,
                SubjectId = 2,
                Price = 150,
                StartAt = DateTime.Now,
                EndAt = DateTime.Now.AddMonths(4)
            }
        };

        mockCourseRepository.Setup(x => x.GetCourseBySchool(schoolId))
            .Returns(courses);

        // Act
        var result = courseService.GetCourseBySchool(schoolId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.All(result, c => Assert.Equal(schoolId, c.SchoolId));
        mockCourseRepository.Verify(x => x.GetCourseBySchool(schoolId), Times.Once);
    }

    [Fact]
    public void GetCourseBySchool_ShouldReturnEmptyList_WhenNoCoursesExistForSchool()
    {
        // Arrange
        var mockCourseRepository = new Mock<ICourseRepository>();
        var mockElasticSearchCourse = new Mock<IElasticSearchCourse>();

        var courseService = new CourseService(
            mockCourseRepository.Object,
            null!,
            mockElasticSearchCourse.Object
        );

        var schoolId = 999;
        mockCourseRepository.Setup(x => x.GetCourseBySchool(schoolId))
            .Returns(new List<Course>());

        // Act
        var result = courseService.GetCourseBySchool(schoolId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
        mockCourseRepository.Verify(x => x.GetCourseBySchool(schoolId), Times.Once);
    }

    #endregion

    // Note: Tests for CreateCourse, UpdateCourse, and DeleteCourse are omitted
    // because they require mocking ElasticCourseVectorSearchService which has
    // complex dependencies. These methods should be tested via integration tests
    // or the service should be refactored to use an interface for better testability.
}
