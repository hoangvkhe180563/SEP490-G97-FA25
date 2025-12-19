using Moq;
using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.UseCases.Exceptions;
using Xunit;
using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using StudyHub.Backend.UseCases.Utils;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class AppUserServiceTests
{

    private readonly Mock<IAppUserRepository> _mockUserRepo;
    private readonly Mock<IAppRoleRepository> _mockRoleRepo;
    private readonly Mock<ICloudinaryRepository> _mockCloudinary;
    private readonly Mock<IConfiguration> _mockConfig;
    private readonly AuthService _authService;
    private readonly AppUserService _service;

    public AppUserServiceTests()
    {
        _mockUserRepo = new Mock<IAppUserRepository>();
        _mockRoleRepo = new Mock<IAppRoleRepository>();
        _mockCloudinary = new Mock<ICloudinaryRepository>();
        _mockConfig = new Mock<IConfiguration>();

        var mockLoginHistory = new Mock<StudyHub.Backend.UseCases.Repositories.IAppUserLoginHistoryRepository>();
        var mockHttpContextAccessor = new Mock<IHttpContextAccessor>();
        var smtpService = new StudyHub.Backend.Api.Services.SmtpEmailService(_mockConfig.Object);
        var mockLocationRepo = new Mock<StudyHub.Backend.UseCases.Repositories.ILocationRepository>();
        var locationService = new StudyHub.Backend.UseCases.Services.LocationService(mockLocationRepo.Object);

        _authService = new AuthService(_mockUserRepo.Object, _mockRoleRepo.Object, mockLoginHistory.Object, smtpService, mockHttpContextAccessor.Object, _mockConfig.Object, locationService);
        _service = new AppUserService(_mockUserRepo.Object, _mockRoleRepo.Object, _mockConfig.Object, _mockCloudinary.Object, _authService, locationService);
    }

    private static IFormFile CreateFormFile(string fileName, byte[] content)
    {
        var ms = new MemoryStream(content);
        var mock = new Mock<IFormFile>();
        mock.Setup(f => f.FileName).Returns(fileName);
        mock.Setup(f => f.Length).Returns(content.Length);
        mock.Setup(f => f.OpenReadStream()).Returns(ms);
        mock.Setup(f => f.ContentType).Returns("image/png");
        return mock.Object;
    }

    // ---------------- Add/Create tests ----------------

    [Fact]
    public async Task CreateAccountAsync_ShouldCreateUser_WhenValidInputs()
    {
        _mockUserRepo.Setup(x => x.GetByEmail(It.IsAny<string>())).Returns((AppUser?)null);
        _mockUserRepo.Setup(x => x.GetByUsername(It.IsAny<string>())).Returns((AppUser?)null);

        AppUser? captured = null;
        _mockUserRepo.Setup(x => x.CreateUser(It.IsAny<AppUser>(), It.IsAny<IEnumerable<Guid>>(), It.IsAny<IEnumerable<short>>()))
            .Callback<AppUser, IEnumerable<Guid>?, IEnumerable<short>?>((u, r, s) => captured = u);

        var result = await _service.CreateAccountAsync("a@b.com", "Pass123!", "user1", null, 0, 0);

        Assert.NotNull(result);
        Assert.Equal("a@b.com", result.Email);
        _mockUserRepo.Verify(x => x.CreateUser(It.IsAny<AppUser>(), null, null), Times.Once);
    }

    [Fact]
    public async Task CreateAccountAsync_ShouldThrow_WhenEmailAlreadyExists()
    {
        _mockUserRepo.Setup(x => x.GetByEmail(It.IsAny<string>())).Returns(new AppUser { Id = Guid.NewGuid(), Email = "a@b.com" });
        await Assert.ThrowsAsync<InvalidFieldException>(() => _service.CreateAccountAsync("a@b.com", "p", "u1", null, 0, 0));
    }

    [Fact]
    public async Task CreateAccountAsync_ShouldThrow_WhenUsernameAlreadyExists()
    {
        _mockUserRepo.Setup(x => x.GetByEmail(It.IsAny<string>())).Returns((AppUser?)null);
        _mockUserRepo.Setup(x => x.GetByUsername(It.IsAny<string>())).Returns(new AppUser { Id = Guid.NewGuid(), Username = "u1" });
        await Assert.ThrowsAsync<InvalidFieldException>(() => _service.CreateAccountAsync("x@y.com", "p", "u1", null, 0, 0));
    }

    [Fact]
    public async Task CreateAccountAsync_ShouldUploadAvatar_AndCleanup_WhenRepoThrows()
    {
        _mockUserRepo.Setup(x => x.GetByEmail(It.IsAny<string>())).Returns((AppUser?)null);
        _mockUserRepo.Setup(x => x.GetByUsername(It.IsAny<string>())).Returns((AppUser?)null);

        var file = CreateFormFile("avatar.png", new byte[10]);
        _mockCloudinary.Setup(x => x.UploadImageAsync(file, It.IsAny<string>())).ReturnsAsync("http://img.url/new.png");
        _mockUserRepo.Setup(x => x.CreateUser(It.IsAny<AppUser>(), It.IsAny<IEnumerable<Guid>>(), It.IsAny<IEnumerable<short>>())).Throws(new Exception("DB"));

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateAccountAsync("x@y.com", "p", "u1", null, 0, 0, null, null, file));
        _mockCloudinary.Verify(x => x.DeleteImageAsync("http://img.url/new.png"), Times.Once);
    }

    [Fact]
    public async Task CreateAccountAsync_ShouldHashPassword()
    {
        _mockUserRepo.Setup(x => x.GetByEmail(It.IsAny<string>())).Returns((AppUser?)null);
        _mockUserRepo.Setup(x => x.GetByUsername(It.IsAny<string>())).Returns((AppUser?)null);

        AppUser? captured = null;
        _mockUserRepo.Setup(x => x.CreateUser(It.IsAny<AppUser>(), It.IsAny<IEnumerable<Guid>>(), It.IsAny<IEnumerable<short>>()))
            .Callback<AppUser, IEnumerable<Guid>?, IEnumerable<short>?>((u, r, s) => captured = u);

        var result = await _service.CreateAccountAsync("e@f.com", "MySecret123", "uname", null, 0, 0);

        Assert.NotNull(captured);
        Assert.False(string.IsNullOrEmpty(captured.PasswordHash));
        Assert.NotEqual("MySecret123", captured.PasswordHash);
    }

    [Fact]
    public async Task CreateAccountAsync_ShouldValidateRoleCombination_ExternalAndSchool()
    {
        var externalRoleId = Guid.NewGuid();
        var schoolRoleId = Guid.NewGuid();
        _mockRoleRepo.Setup(x => x.GetRoleById(externalRoleId)).Returns(new AppRole { Id = externalRoleId, Name = "External Student" });
        _mockRoleRepo.Setup(x => x.GetRoleById(schoolRoleId)).Returns(new AppRole { Id = schoolRoleId, Name = "School Student" });
        _mockUserRepo.Setup(x => x.GetByEmail(It.IsAny<string>())).Returns((AppUser?)null);
        _mockUserRepo.Setup(x => x.GetByUsername(It.IsAny<string>())).Returns((AppUser?)null);

        await Assert.ThrowsAsync<InvalidFieldException>(() => _service.CreateAccountAsync("z@z.com", "p", "u2", new List<Guid> { externalRoleId, schoolRoleId }, 0, 0));
    }

    [Fact]
    public async Task CreateAccountAsync_ShouldValidateRoleCombination_StudentAndManager()
    {
        var externalRoleId = Guid.NewGuid();
        var teacherRoleId = Guid.NewGuid();
        _mockRoleRepo.Setup(x => x.GetRoleById(externalRoleId)).Returns(new AppRole { Id = externalRoleId, Name = "External Student" });
        _mockRoleRepo.Setup(x => x.GetRoleById(teacherRoleId)).Returns(new AppRole { Id = teacherRoleId, Name = "Teacher" });
        _mockUserRepo.Setup(x => x.GetByEmail(It.IsAny<string>())).Returns((AppUser?)null);
        _mockUserRepo.Setup(x => x.GetByUsername(It.IsAny<string>())).Returns((AppUser?)null);

        await Assert.ThrowsAsync<InvalidFieldException>(() => _service.CreateAccountAsync("s@t.com", "p", "u3", new List<Guid> { externalRoleId, teacherRoleId }, 0, 0));
    }

    [Fact]
    public async Task CreateAccountAsync_ShouldAcceptRoles_WhenValid()
    {
        var roleId = Guid.NewGuid();
        _mockRoleRepo.Setup(x => x.GetRoleById(roleId)).Returns(new AppRole { Id = roleId, Name = "Student" });
        _mockUserRepo.Setup(x => x.GetByEmail(It.IsAny<string>())).Returns((AppUser?)null);
        _mockUserRepo.Setup(x => x.GetByUsername(It.IsAny<string>())).Returns((AppUser?)null);

        await _service.CreateAccountAsync("ok@ok.com", "p", "uok", new List<Guid> { roleId }, 0, 0);
        _mockUserRepo.Verify(x => x.CreateUser(It.IsAny<AppUser>(), It.IsAny<IEnumerable<Guid>>(), It.IsAny<IEnumerable<short>>()), Times.Once);
    }

    [Fact]
    public async Task CreateAccountAsync_ShouldReject_LargeAvatar()
    {
        _mockUserRepo.Setup(x => x.GetByEmail(It.IsAny<string>())).Returns((AppUser?)null);
        _mockUserRepo.Setup(x => x.GetByUsername(It.IsAny<string>())).Returns((AppUser?)null);
        var large = new byte[FileConstants.MaxImageSize + 1];
        var file = CreateFormFile("big.png", large);

        await Assert.ThrowsAsync<InvalidFieldException>(() => _service.CreateAccountAsync("big@img.com", "p", "ubig", null, 0, 0, null, null, file));
    }

    // ---------------- Update/Edit tests ----------------

    [Fact]
    public async Task EditAccountAsync_ShouldReturnNull_WhenUserNotFound()
    {
        _mockUserRepo.Setup(x => x.GetById(It.IsAny<Guid>())).Returns((AppUser?)null);
        var outp = await _service.EditAccountAsync(Guid.NewGuid());
        Assert.Null(outp);
    }

    [Fact]
    public async Task EditAccountAsync_ShouldUpdateFields_WhenValid_NoAvatar()
    {
        var id = Guid.NewGuid();
        var user = new AppUser { Id = id, Email = "a@b.com", Username = "u1", Fullname = "Old" };
        _mockUserRepo.Setup(x => x.GetById(id)).Returns(user);
        _mockUserRepo.Setup(x => x.GetByEmail(It.IsAny<string>())).Returns((AppUser?)null);
        _mockUserRepo.Setup(x => x.GetByUsername(It.IsAny<string>())).Returns((AppUser?)null);

        AppUser? captured = null;
        _mockUserRepo.Setup(x => x.UpdateUser(It.IsAny<AppUser>(), It.IsAny<IEnumerable<Guid>>(), It.IsAny<IEnumerable<short>>()))
            .Callback<AppUser, IEnumerable<Guid>?, IEnumerable<short>?>((u, r, s) => captured = u);

        var result = await _service.EditAccountAsync(id, email: "new@b.com", username: "newu", fullname: "NewName");

        Assert.NotNull(result);
        Assert.Equal("new@b.com", captured.Email);
        Assert.Equal("newu", captured.Username);
        _mockUserRepo.Verify(x => x.UpdateUser(It.IsAny<AppUser>(), null, null), Times.Once);
    }

    [Fact]
    public async Task EditAccountAsync_ShouldThrow_WhenEmailExistsForOtherUser()
    {
        var id = Guid.NewGuid();
        var user = new AppUser { Id = id, Email = "a@b.com", Username = "u1" };
        _mockUserRepo.Setup(x => x.GetById(id)).Returns(user);
        _mockUserRepo.Setup(x => x.GetByEmail("dup@e.com")).Returns(new AppUser { Id = Guid.NewGuid(), Email = "dup@e.com" });

        await Assert.ThrowsAsync<InvalidFieldException>(() => _service.EditAccountAsync(id, email: "dup@e.com"));
    }

    [Fact]
    public async Task EditAccountAsync_ShouldThrow_WhenUsernameExistsForOtherUser()
    {
        var id = Guid.NewGuid();
        var user = new AppUser { Id = id, Email = "a@b.com", Username = "u1" };
        _mockUserRepo.Setup(x => x.GetById(id)).Returns(user);
        _mockUserRepo.Setup(x => x.GetByUsername("dupuser")).Returns(new AppUser { Id = Guid.NewGuid(), Username = "dupuser" });

        await Assert.ThrowsAsync<InvalidFieldException>(() => _service.EditAccountAsync(id, username: "dupuser"));
    }

    [Fact]
    public async Task EditAccountAsync_ShouldHandleRoleCombinationConflict()
    {
        var id = Guid.NewGuid();
        var user = new AppUser { Id = id };
        _mockUserRepo.Setup(x => x.GetById(id)).Returns(user);

        var r1 = Guid.NewGuid(); var r2 = Guid.NewGuid();
        _mockRoleRepo.Setup(x => x.GetRoleById(r1)).Returns(new AppRole { Id = r1, Name = "External Student" });
        _mockRoleRepo.Setup(x => x.GetRoleById(r2)).Returns(new AppRole { Id = r2, Name = "School Student" });

        await Assert.ThrowsAsync<InvalidFieldException>(() => _service.EditAccountAsync(id, roleIds: new List<Guid> { r1, r2 }));
    }

    [Fact]
    public async Task EditAccountAsync_ShouldUploadNewAvatar_AndDeleteOld_OnSuccess()
    {
        var id = Guid.NewGuid();
        var user = new AppUser { Id = id, Avatar = "http://img.url/old.png" };
        _mockUserRepo.Setup(x => x.GetById(id)).Returns(user);
        var file = CreateFormFile("avatar.png", new byte[10]);
        _mockCloudinary.Setup(x => x.UploadImageAsync(file, It.IsAny<string>())).ReturnsAsync("http://img.url/new.png");

        AppUser captured = null!;
        _mockUserRepo.Setup(x => x.UpdateUser(It.IsAny<AppUser>(), It.IsAny<IEnumerable<Guid>>(), It.IsAny<IEnumerable<short>>()))
            .Callback<AppUser, IEnumerable<Guid>?, IEnumerable<short>?>((u, r, s) => captured = u);

        var result = await _service.EditAccountAsync(id, avatarFile: file);

        _mockCloudinary.Verify(x => x.DeleteImageAsync("http://img.url/old.png"), Times.Once);
        Assert.Equal("http://img.url/new.png", captured.Avatar);
    }

    [Fact]
    public async Task EditAccountAsync_ShouldRollbackUpload_WhenUpdateFails()
    {
        var id = Guid.NewGuid();
        var user = new AppUser { Id = id, Avatar = null };
        _mockUserRepo.Setup(x => x.GetById(id)).Returns(user);
        var file = CreateFormFile("avatar.png", new byte[10]);
        _mockCloudinary.Setup(x => x.UploadImageAsync(file, It.IsAny<string>())).ReturnsAsync("http://img.url/new.png");
        _mockUserRepo.Setup(x => x.UpdateUser(It.IsAny<AppUser>(), It.IsAny<IEnumerable<Guid>>(), It.IsAny<IEnumerable<short>>())).Throws(new Exception("DB"));

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.EditAccountAsync(id, avatarFile: file));
        _mockCloudinary.Verify(x => x.DeleteImageAsync("http://img.url/new.png"), Times.Once);
    }

    [Fact]
    public async Task EditAccountAsync_ShouldReject_LargeAvatar()
    {
        var id = Guid.NewGuid();
        var user = new AppUser { Id = id };
        _mockUserRepo.Setup(x => x.GetById(id)).Returns(user);
        var large = new byte[FileConstants.MaxImageSize + 1];
        var file = CreateFormFile("big.png", large);

        await Assert.ThrowsAsync<InvalidFieldException>(() => _service.EditAccountAsync(id, avatarFile: file));
    }

    [Fact]
    public async Task EditAccountAsync_ShouldChangeStatusAndGender()
    {
        var id = Guid.NewGuid();
        var user = new AppUser { Id = id, Status = true, Gender = true };
        _mockUserRepo.Setup(x => x.GetById(id)).Returns(user);

        AppUser? captured = null;
        _mockUserRepo.Setup(x => x.UpdateUser(It.IsAny<AppUser>(), It.IsAny<IEnumerable<Guid>>(), It.IsAny<IEnumerable<short>>()))
            .Callback<AppUser, IEnumerable<Guid>?, IEnumerable<short>?>((u, r, s) => captured = u);

        var result = await _service.EditAccountAsync(id, status: false, gender: 0);

        Assert.False(captured.Status);
        Assert.False(captured.Gender);
    }

    [Fact]
    public async Task EditAccountAsync_ShouldNotDeleteOldAvatar_WhenNoChange()
    {
        var id = Guid.NewGuid();
        var user = new AppUser { Id = id, Avatar = "http://img.url/old.png" };
        _mockUserRepo.Setup(x => x.GetById(id)).Returns(user);

        var result = await _service.EditAccountAsync(id, fullname: "NoChange");

        _mockCloudinary.Verify(x => x.DeleteImageAsync(It.IsAny<string>()), Times.Never);
        _mockUserRepo.Verify(x => x.UpdateUser(It.IsAny<AppUser>(), null, null), Times.Once);
    }

}

