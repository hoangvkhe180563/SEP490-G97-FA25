using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Moq;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Domain.Entities.Notifications;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Repositories.Notifications;
using StudyHub.Backend.UseCases.Services;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class ClassServiceTests
{
    private Mock<IConfiguration> CreateMockConfiguration()
    {
        var mockConfig = new Mock<IConfiguration>();

        // ✅ ĐÚNG - Mock SMTP section với indexer
        var mockSmtpSection = new Mock<IConfigurationSection>();
        mockSmtpSection.Setup(x => x["Host"]).Returns("smtp.example.com");
        mockSmtpSection.Setup(x => x["Port"]).Returns("587");
        mockSmtpSection.Setup(x => x["User"]).Returns("test@example.com");
        mockSmtpSection.Setup(x => x["Password"]).Returns("password123");
        mockSmtpSection.Setup(x => x["From"]).Returns("noreply@studyhub.com");

        mockConfig.Setup(x => x.GetSection("Smtp")).Returns(mockSmtpSection.Object);

        // ✅ ĐÚNG - Mock JWT section với indexer
        var mockJwtSection = new Mock<IConfigurationSection>();
        mockJwtSection.Setup(x => x["SecretKey"]).Returns("ThisIsAVeryLongSecretKeyForTestingPurposesOnly123456");
        mockJwtSection.Setup(x => x["Issuer"]).Returns("TestIssuer");
        mockJwtSection.Setup(x => x["Audience"]).Returns("TestAudience");
        mockJwtSection.Setup(x => x["ExpiresMinutes"]).Returns("60");
        mockJwtSection.Setup(x => x["RefreshExpiresMinutes"]).Returns("10080");

        mockConfig.Setup(x => x.GetSection("JwtSettings")).Returns(mockJwtSection.Object);

        // ✅ ĐÚNG - Mock App settings với indexer
        mockConfig.Setup(x => x["App: BaseUrl"]).Returns("http://localhost:5173");
        mockConfig.Setup(x => x["App:Name"]).Returns("StudyHub");

        return mockConfig;
    }

    private SmtpEmailService CreateMockEmailService()
    {
        return new SmtpEmailService(CreateMockConfiguration().Object);
    }

    private AuthService CreateMockAuthService()
    {
        var mockUserRepo = new Mock<IAppUserRepository>();
        var mockRoleRepo = new Mock<IAppRoleRepository>();
        var mockLoginHistoryRepo = new Mock<IAppUserLoginHistoryRepository>();
        var mockEmailService = CreateMockEmailService();
        var mockHttpContextAccessor = new Mock<IHttpContextAccessor>();
        var mockConfig = CreateMockConfiguration();
        var mockLocationRepo = new Mock<StudyHub.Backend.UseCases.Repositories.ILocationRepository>();
        var locationService = new StudyHub.Backend.UseCases.Services.LocationService(mockLocationRepo.Object);

        return new AuthService(
            mockUserRepo.Object,
            mockRoleRepo.Object,
            mockLoginHistoryRepo.Object,
            mockEmailService,
            mockHttpContextAccessor.Object,
            mockConfig.Object,
            locationService
        );
    }

    private NotificationService CreateMockNotificationService()
    {
        var mockNotificationRepo = new Mock<INotificationRepository>();
        return new NotificationService(mockNotificationRepo.Object);
    }

    #region GetClassesPaged Tests

    [Fact]
    public void GetClassesPaged_ShouldReturnPagedResult_WhenClassesExist()
    {
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var mockAuthService = CreateMockAuthService();
        var mockEmailService = CreateMockEmailService();
        var mockNotificationService = CreateMockNotificationService();
        var mockNotificationOfClassRepo = new Mock<INotificationOfClassRepository>();
        var mockNotificationRepo = new Mock<INotificationRepository>();

        var service = new ClassService(
            mockClassRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            mockAuthService,
            mockEmailService,
            mockNotificationService,
            mockNotificationOfClassRepo.Object,
            mockNotificationRepo.Object
        );

        var userId = Guid.NewGuid();
        var classes = new List<Class>
        {
            new Class { Id = 1, Name = "Math 101", CreatedBy = userId, DeletedAt = null },
            new Class { Id = 2, Name = "Science 101", CreatedBy = userId, DeletedAt = null }
        };

        mockClassRepo.Setup(x => x.GetAllClasses(userId)).Returns(classes);

        var result = service.GetClassesPaged(null, null, userId, 1, 10);

        Assert.Equal(2, result.TotalItems);
        Assert.Equal(2, result.Classes.Count);
        Assert.Equal(1, result.Page);
        Assert.Equal(10, result.Limit);
        mockClassRepo.Verify(x => x.GetAllClasses(userId), Times.Once);
    }

    [Fact]
    public void GetClassesPaged_ShouldFilterByQuery_WhenQueryProvided()
    {
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var mockAuthService = CreateMockAuthService();
        var mockEmailService = CreateMockEmailService();
        var mockNotificationService = CreateMockNotificationService();
        var mockNotificationOfClassRepo = new Mock<INotificationOfClassRepository>();
        var mockNotificationRepo = new Mock<INotificationRepository>();

        var service = new ClassService(
            mockClassRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            mockAuthService,
            mockEmailService,
            mockNotificationService,
            mockNotificationOfClassRepo.Object,
            mockNotificationRepo.Object
        );

        var userId = Guid.NewGuid();
        var classes = new List<Class>
        {
            new Class { Id = 1, Name = "Math 101", CreatedBy = userId, DeletedAt = null },
            new Class { Id = 2, Name = "Science 101", CreatedBy = userId, DeletedAt = null }
        };

        mockClassRepo.Setup(x => x.GetAllClasses(userId)).Returns(classes);

        var result = service.GetClassesPaged("Math", null, userId, 1, 10);

        Assert.Equal(1, result.TotalItems);
        Assert.Single(result.Classes);
        Assert.Equal("Math 101", result.Classes[0].Name);
    }

    #endregion

    #region GetClassById Tests

    [Fact]
    public void GetClassById_ShouldReturnClass_WhenClassExists()
    {
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var mockAuthService = CreateMockAuthService();
        var mockEmailService = CreateMockEmailService();
        var mockNotificationService = CreateMockNotificationService();
        var mockNotificationOfClassRepo = new Mock<INotificationOfClassRepository>();
        var mockNotificationRepo = new Mock<INotificationRepository>();

        var service = new ClassService(
            mockClassRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            mockAuthService,
            mockEmailService,
            mockNotificationService,
            mockNotificationOfClassRepo.Object,
            mockNotificationRepo.Object
        );

        var classId = 1;
        var cls = new Class { Id = classId, Name = "Math 101", CreatedBy = Guid.NewGuid() };

        mockClassRepo.Setup(x => x.GetClassById(classId)).Returns(cls);

        var result = service.GetClassById(classId);

        Assert.NotNull(result);
        Assert.Equal(classId, result.Id);
        Assert.Equal("Math 101", result.Name);
        mockClassRepo.Verify(x => x.GetClassById(classId), Times.Once);
    }

    #endregion

    #region CreateClass Tests

    [Fact]
    public void CreateClass_ShouldCreateAndReturnClass_WhenValidDataProvided()
    {
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var mockAuthService = CreateMockAuthService();
        var mockEmailService = CreateMockEmailService();
        var mockNotificationService = CreateMockNotificationService();
        var mockNotificationOfClassRepo = new Mock<INotificationOfClassRepository>();
        var mockNotificationRepo = new Mock<INotificationRepository>();

        var service = new ClassService(
            mockClassRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            mockAuthService,
            mockEmailService,
            mockNotificationService,
            mockNotificationOfClassRepo.Object,
            mockNotificationRepo.Object
        );

        var userId = Guid.NewGuid();
        var dto = new Class
        {
            Name = "  Math 101  ",
            Description = "Basic Math",
            Grade = 10,
            CreatedBy = userId
        };

        var createdClass = new Class
        {
            Id = 1,
            Name = "Math 101",
            Description = "Basic Math",
            Grade = 10,
            CreatedBy = userId,
            CreatedAt = DateTime.Now
        };

        mockClassRepo.Setup(x => x.CreateClass(It.IsAny<Class>())).Returns(createdClass);

        var result = service.CreateClass(dto);

        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("Math 101", result.Name);
        mockClassRepo.Verify(x => x.CreateClass(It.Is<Class>(c => c.Name == "Math 101")), Times.Once);
    }

    #endregion
}