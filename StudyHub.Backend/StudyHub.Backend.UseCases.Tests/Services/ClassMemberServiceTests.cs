using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Moq;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class ClassMemberServiceTests
{
    // ✅ Helper: Tạo EmailService thật
    private SmtpEmailService CreateEmailService()
    {
        var mockConfig = new Mock<IConfiguration>();

        var mockSmtpSection = new Mock<IConfigurationSection>();
        mockSmtpSection.Setup(x => x["Host"]).Returns("smtp.test.com");
        mockSmtpSection.Setup(x => x["Port"]).Returns("587");
        mockSmtpSection.Setup(x => x["User"]).Returns("test@test. com");
        mockSmtpSection.Setup(x => x["Password"]).Returns("password");
        mockSmtpSection.Setup(x => x["From"]).Returns("no-reply@test. com");

        mockConfig.Setup(x => x.GetSection("Smtp")).Returns(mockSmtpSection.Object);
        mockConfig.Setup(x => x["App:BaseUrl:Production"]).Returns("http://localhost:5173");
        mockConfig.Setup(x => x["App:Name"]).Returns("StudyHub");

        return new SmtpEmailService(mockConfig.Object);
    }

    #region GetClassMembers Tests

    [Fact]
    public void GetClassMembers_ShouldReturnMembers_WhenClassExists()
    {
        // Arrange
        var mockClassMemberRepo = new Mock<IClassMemberRepository>();
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService(); // ✅ Service thật

        var service = new ClassMemberService(
            mockClassMemberRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            mockClassRepo.Object
        );

        var classId = 1;
        var members = new List<AppUserClass>
        {
            new AppUserClass { UserId = Guid.NewGuid(), ClassId = classId },
            new AppUserClass { UserId = Guid.NewGuid(), ClassId = classId }
        };

        mockClassMemberRepo.Setup(x => x.GetClassMembers(classId)).Returns(members);

        // Act
        var result = service.GetClassMembers(classId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        mockClassMemberRepo.Verify(x => x.GetClassMembers(classId), Times.Once);
    }

    [Fact]
    public void GetClassMembers_ShouldReturnEmptyList_WhenNoMembers()
    {
        // Arrange
        var mockClassMemberRepo = new Mock<IClassMemberRepository>();
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();

        var service = new ClassMemberService(
            mockClassMemberRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            mockClassRepo.Object
        );

        var classId = 1;
        mockClassMemberRepo.Setup(x => x.GetClassMembers(classId)).Returns(new List<AppUserClass>());

        // Act
        var result = service.GetClassMembers(classId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
        mockClassMemberRepo.Verify(x => x.GetClassMembers(classId), Times.Once);
    }

    #endregion

    #region InviteByEmailsAsync Tests

    [Fact]
    public async Task InviteByEmailsAsync_ShouldThrowException_WhenClassNotFound()
    {
        // Arrange
        var mockClassMemberRepo = new Mock<IClassMemberRepository>();
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();

        var service = new ClassMemberService(
            mockClassMemberRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            mockClassRepo.Object
        );

        var classId = 999;
        var emails = new List<string> { "test@example.com" };

        mockClassRepo.Setup(x => x.GetClassById(classId)).Returns((Class?)null);

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.InviteByEmailsAsync(classId, emails, "student", null, "http://localhost:5173")
        );
    }

    [Fact]
    public async Task InviteByEmailsAsync_ShouldThrowException_WhenNoEmailsProvided()
    {
        // Arrange
        var mockClassMemberRepo = new Mock<IClassMemberRepository>();
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();

        var service = new ClassMemberService(
            mockClassMemberRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            mockClassRepo.Object
        );

        var classId = 1;
        var cls = new Class { Id = classId, Name = "Test Class", CreatedBy = Guid.NewGuid() };

        mockClassRepo.Setup(x => x.GetClassById(classId)).Returns(cls);

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.InviteByEmailsAsync(classId, new List<string>(), "student", null, "http://localhost:5173")
        );
    }

    #endregion

    #region ConfirmMemberFromString Tests

    [Fact]
    public void ConfirmMemberFromString_ShouldReturnNull_WhenInvalidGuid()
    {
        // Arrange
        var mockClassMemberRepo = new Mock<IClassMemberRepository>();
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();

        var service = new ClassMemberService(
            mockClassMemberRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            mockClassRepo.Object
        );

        var classId = 1;
        var invalidUserId = "not-a-guid";

        // Act
        var result = service.ConfirmMemberFromString(classId, invalidUserId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void ConfirmMemberFromString_ShouldReturnFalse_WhenClassNotFound()
    {
        // Arrange
        var mockClassMemberRepo = new Mock<IClassMemberRepository>();
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();

        var service = new ClassMemberService(
            mockClassMemberRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            mockClassRepo.Object
        );

        var classId = 999;
        var userId = Guid.NewGuid().ToString();

        mockClassRepo.Setup(x => x.GetClassById(classId)).Returns((Class?)null);

        // Act
        var result = service.ConfirmMemberFromString(classId, userId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void ConfirmMemberFromString_ShouldReturnTrue_WhenConfirmSuccessful()
    {
        // Arrange
        var mockClassMemberRepo = new Mock<IClassMemberRepository>();
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();

        var service = new ClassMemberService(
            mockClassMemberRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            mockClassRepo.Object
        );

        var classId = 1;
        var userId = Guid.NewGuid();
        var cls = new Class { Id = classId, Name = "Test Class", CreatedBy = Guid.NewGuid() };

        mockClassRepo.Setup(x => x.GetClassById(classId)).Returns(cls);
        mockClassMemberRepo.Setup(x => x.ConfirmMember(userId, classId)).Returns(true);

        // Act
        var result = service.ConfirmMemberFromString(classId, userId.ToString());

        // Assert
        Assert.True(result);
        mockClassMemberRepo.Verify(x => x.ConfirmMember(userId, classId), Times.Once);
    }

    #endregion

    #region DeclineMemberFromString Tests

    [Fact]
    public void DeclineMemberFromString_ShouldReturnNull_WhenInvalidGuid()
    {
        // Arrange
        var mockClassMemberRepo = new Mock<IClassMemberRepository>();
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();

        var service = new ClassMemberService(
            mockClassMemberRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            mockClassRepo.Object
        );

        var classId = 1;
        var invalidUserId = "not-a-guid";

        // Act
        var result = service.DeclineMemberFromString(classId, invalidUserId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void DeclineMemberFromString_ShouldReturnTrue_WhenDeclineSuccessful()
    {
        // Arrange
        var mockClassMemberRepo = new Mock<IClassMemberRepository>();
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();

        var service = new ClassMemberService(
            mockClassMemberRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            mockClassRepo.Object
        );

        var classId = 1;
        var userId = Guid.NewGuid();
        var cls = new Class { Id = classId, Name = "Test Class", CreatedBy = Guid.NewGuid() };

        mockClassRepo.Setup(x => x.GetClassById(classId)).Returns(cls);
        mockClassMemberRepo.Setup(x => x.DeclineMember(userId, classId)).Returns(true);

        // Act
        var result = service.DeclineMemberFromString(classId, userId.ToString());

        // Assert
        Assert.True(result);
        mockClassMemberRepo.Verify(x => x.DeclineMember(userId, classId), Times.Once);
    }

    #endregion

    #region KickMemberFromString Tests

    [Fact]
    public void KickMemberFromString_ShouldReturnNull_WhenInvalidGuid()
    {
        // Arrange
        var mockClassMemberRepo = new Mock<IClassMemberRepository>();
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();

        var service = new ClassMemberService(
            mockClassMemberRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            mockClassRepo.Object
        );

        var classId = 1;
        var invalidUserId = "not-a-guid";

        // Act
        var result = service.KickMemberFromString(classId, invalidUserId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void KickMemberFromString_ShouldReturnFalse_WhenClassNotFound()
    {
        // Arrange
        var mockClassMemberRepo = new Mock<IClassMemberRepository>();
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();

        var service = new ClassMemberService(
            mockClassMemberRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            mockClassRepo.Object
        );

        var classId = 999;
        var userId = Guid.NewGuid().ToString();

        mockClassRepo.Setup(x => x.GetClassById(classId)).Returns((Class?)null);

        // Act
        var result = service.KickMemberFromString(classId, userId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void KickMemberFromString_ShouldReturnTrue_WhenKickSuccessful()
    {
        // Arrange
        var mockClassMemberRepo = new Mock<IClassMemberRepository>();
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();

        var service = new ClassMemberService(
            mockClassMemberRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            mockClassRepo.Object
        );

        var classId = 1;
        var userId = Guid.NewGuid();
        var cls = new Class { Id = classId, Name = "Test Class", CreatedBy = Guid.NewGuid() };

        mockClassRepo.Setup(x => x.GetClassById(classId)).Returns(cls);
        mockClassMemberRepo.Setup(x => x.KickMember(userId, classId)).Returns(true);

        // Act
        var result = service.KickMemberFromString(classId, userId.ToString());

        // Assert
        Assert.True(result);
        mockClassMemberRepo.Verify(x => x.KickMember(userId, classId), Times.Once);
    }

    #endregion

    #region GetAllClassByUserId Tests

    [Fact]
    public void GetAllClassByUserId_ShouldReturnClasses_WhenUserHasClasses()
    {
        // Arrange
        var mockClassMemberRepo = new Mock<IClassMemberRepository>();
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();

        var service = new ClassMemberService(
            mockClassMemberRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            mockClassRepo.Object
        );

        var userId = Guid.NewGuid();
        var classes = new List<Class>
        {
            new Class { Id = 1, Name = "Math", CreatedBy = userId },
            new Class { Id = 2, Name = "Science", CreatedBy = userId }
        };

        mockClassRepo.Setup(x => x.GetAllClassByUserId(userId)).Returns(classes);

        // Act
        var result = service.GetAllClassByUserId(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        mockClassRepo.Verify(x => x.GetAllClassByUserId(userId), Times.Once);
    }

    [Fact]
    public void GetAllClassByUserId_ShouldReturnEmptyList_WhenUserHasNoClasses()
    {
        // Arrange
        var mockClassMemberRepo = new Mock<IClassMemberRepository>();
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();

        var service = new ClassMemberService(
            mockClassMemberRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            mockClassRepo.Object
        );

        var userId = Guid.NewGuid();
        mockClassRepo.Setup(x => x.GetAllClassByUserId(userId)).Returns(new List<Class>());

        // Act
        var result = service.GetAllClassByUserId(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
        mockClassRepo.Verify(x => x.GetAllClassByUserId(userId), Times.Once);
    }

    #endregion

    #region InviteMember Tests

    [Fact]
    public void InviteMember_ShouldReturnTrue_WhenInviteSuccessful()
    {
        // Arrange
        var mockClassMemberRepo = new Mock<IClassMemberRepository>();
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();

        var service = new ClassMemberService(
            mockClassMemberRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            mockClassRepo.Object
        );

        var userId = Guid.NewGuid();
        var classId = 1;

        mockClassMemberRepo.Setup(x => x.InviteMember(userId, classId)).Returns(true);

        // Act
        var result = service.InviteMember(userId, classId);

        // Assert
        Assert.True(result);
        mockClassMemberRepo.Verify(x => x.InviteMember(userId, classId), Times.Once);
    }

    #endregion

    #region ConfirmMember Tests

    [Fact]
    public void ConfirmMember_ShouldReturnTrue_WhenConfirmSuccessful()
    {
        // Arrange
        var mockClassMemberRepo = new Mock<IClassMemberRepository>();
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();

        var service = new ClassMemberService(
            mockClassMemberRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            mockClassRepo.Object
        );

        var userId = Guid.NewGuid();
        var classId = 1;

        mockClassMemberRepo.Setup(x => x.ConfirmMember(userId, classId)).Returns(true);

        // Act
        var result = service.ConfirmMember(userId, classId);

        // Assert
        Assert.True(result);
        mockClassMemberRepo.Verify(x => x.ConfirmMember(userId, classId), Times.Once);
    }

    #endregion

    #region KickMember Tests

    [Fact]
    public void KickMember_ShouldReturnTrue_WhenKickSuccessful()
    {
        // Arrange
        var mockClassMemberRepo = new Mock<IClassMemberRepository>();
        var mockClassRepo = new Mock<IClassRepository>();
        var mockFileStorage = new Mock<ICloudinaryRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();
        var emailService = CreateEmailService();

        var service = new ClassMemberService(
            mockClassMemberRepo.Object,
            mockFileStorage.Object,
            mockUserRepo.Object,
            emailService,
            mockClassRepo.Object
        );

        var userId = Guid.NewGuid();
        var classId = 1;

        mockClassMemberRepo.Setup(x => x.KickMember(userId, classId)).Returns(true);

        // Act
        var result = service.KickMember(userId, classId);

        // Assert
        Assert.True(result);
        mockClassMemberRepo.Verify(x => x.KickMember(userId, classId), Times.Once);
    }

    #endregion
}