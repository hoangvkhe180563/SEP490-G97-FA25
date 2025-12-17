using Microsoft.AspNetCore.Http;
using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.UseCases.Utils;

namespace StudyHub.Backend.UseCases.Tests.Services
{
    public class LandingPageServiceTests
    {
        [Fact]
        public void GetGeneralLandingPage_ShouldReturnLandingPage_WhenCalled()
        {
            //Arrange
            var mockLandingPageRepo = new Mock<ILandingPageRepository>();
            var mockCloudinaryRepo = new Mock<ICloudinaryRepository>();
            var landingPageService = new LandingPageService(mockLandingPageRepo.Object, mockCloudinaryRepo.Object, null!, null!);
            var landingPageData = new LandingPage
            {
                SchoolId = 0,
                BannerUrl = "/banner-image.png",
                SchoolLogoUrl = "/StudyHubLogo.png",
                Description = "StudyHub là một trang web phục vụ học tập và ôn luyện cho học sinh, giúp học sinh định hướng được phương pháp học tập cho bản thân.",
                FeaturedCourses = [],
                FeaturedDocuments = [],
                FeaturedTeachers = [],
                LandingPageImages = []
            };
            mockLandingPageRepo.Setup(x => x.GetLandingPage(0)).Returns(landingPageData);

            //Act
            var result = landingPageService.GetGeneralLandingPage();
            //Assert
            Assert.NotNull(result);
            Assert.IsType<LandingPage>(result);
            Assert.Equal(landingPageData, result);
            mockLandingPageRepo.Verify(m => m.GetLandingPage(0), Times.Once);
        }

        [Fact]
        public void GetSchoolAddress_ShouldReturnAddressString_WhenSchoolIdValid()
        {
            //Arrange
            var mockLandingPageRepo = new Mock<ILandingPageRepository>();
            var mockCloudinaryRepo = new Mock<ICloudinaryRepository>();
            var landingPageService = new LandingPageService(mockLandingPageRepo.Object, mockCloudinaryRepo.Object, null!, null!);
            int schoolId = 1;
            string expectedAddress = "123 Đường A, Phường B, Thành phố C";
            mockLandingPageRepo.Setup(r => r.GetSchoolAddress(schoolId))
                .Returns(expectedAddress);

            //Act
            var result = landingPageService.GetSchoolAddress(schoolId);
            //Assert
            Assert.Equal(expectedAddress, result);
            mockLandingPageRepo.Verify(r => r.GetSchoolAddress(schoolId), Times.Once);
        }

        [Fact]
        public void GetSchoolAddress_ShouldReturnEmptyString_WhenSchoolIdInvalid()
        {
            //Arrange
            var mockLandingPageRepo = new Mock<ILandingPageRepository>();
            var mockCloudinaryRepo = new Mock<ICloudinaryRepository>();
            var landingPageService = new LandingPageService(mockLandingPageRepo.Object, mockCloudinaryRepo.Object, null!, null!);
            int schoolId = 0;
            mockLandingPageRepo.Setup(r => r.GetSchoolAddress(schoolId))
                .Returns(string.Empty);

            //Act
            var result = landingPageService.GetSchoolAddress(schoolId);
            //Assert
            Assert.Equal(string.Empty, result);
            mockLandingPageRepo.Verify(r => r.GetSchoolAddress(schoolId), Times.Once);
        }

        [Fact]
        public void GetSchoolLandingPage_ShouldReturnLandingPage_WhenSchoolIdValid()
        {
            //Arrange
            var mockLandingPageRepo = new Mock<ILandingPageRepository>();
            var mockCloudinaryRepo = new Mock<ICloudinaryRepository>();
            var landingPageService = new LandingPageService(mockLandingPageRepo.Object, mockCloudinaryRepo.Object, null!, null!);
            int schoolId = 1;
            var landingPageData = new LandingPage
            {
                SchoolId = 1,
                BannerUrl = "/hts-1.png",
                SchoolLogoUrl = "/hts-2.png",
                Description = "Trường THCS - THPT Hà Thành",
                FeaturedCourses = [
                    new Course {
                        Id = 1,
                        Name = "C# Programming Course",
                        Price = 10000
                    }
                ],
                FeaturedDocuments = [
                    new Document {
                        Id = 1,
                        Name = "C# Programming Document",
                        Description = "The document about C# Programming"
                    }
                ],
                FeaturedTeachers = [
                    new AppUser {
                        Id = new Guid("00000000-0000-0000-0000-000000000001"),
                        Fullname = "Trần Thị Phương Thảo"
                    }
                ],
                LandingPageImages = [
                    "/hts-3.png",
                    "/hts-4.png",
                    "/hts-5.png",
                ]
            };
            mockLandingPageRepo.Setup(r => r.GetLandingPage(schoolId)).Returns(landingPageData);

            //Act
            var result = landingPageService.GetSchoolLandingPage(schoolId);
            //Assert
            Assert.Equal(landingPageData, result);
            mockLandingPageRepo.Verify(m => m.GetLandingPage(schoolId), Times.Once);
            mockLandingPageRepo.Verify(m => m.GetFeaturedTeachers(schoolId), Times.Once);
            mockLandingPageRepo.Verify(m => m.GetFeaturedDocuments(schoolId), Times.Once);
            mockLandingPageRepo.Verify(m => m.GetFeaturedCourses(schoolId), Times.Once);
            mockLandingPageRepo.Verify(m => m.GetLandingPageImages(schoolId), Times.Once);
        }

        [Fact]
        public void GetSchoolLandingPage_ShouldReturnNull_WhenSchoolIdInvalid()
        {
            //Arrange
            var mockLandingPageRepo = new Mock<ILandingPageRepository>();
            var mockCloudinaryRepo = new Mock<ICloudinaryRepository>();
            var landingPageService = new LandingPageService(mockLandingPageRepo.Object, mockCloudinaryRepo.Object, null!, null!);
            int schoolId = 0;
            mockLandingPageRepo.Setup(r => r.GetLandingPage(schoolId)).Returns((LandingPage)null!);

            //Act
            var result = landingPageService.GetSchoolLandingPage(schoolId);
            //Assert
            Assert.Null(result);
            mockLandingPageRepo.Verify(m => m.GetLandingPage(schoolId), Times.Never);
            mockLandingPageRepo.Verify(m => m.GetFeaturedTeachers(schoolId), Times.Never);
            mockLandingPageRepo.Verify(m => m.GetFeaturedDocuments(schoolId), Times.Never);
            mockLandingPageRepo.Verify(m => m.GetFeaturedCourses(schoolId), Times.Never);
            mockLandingPageRepo.Verify(m => m.GetLandingPageImages(schoolId), Times.Never);
        }

        [Fact]
        public async Task UpdateLandingPage_ShouldReturnError_WhenBannerUploadFails()
        {
            // Arrange
            var mockLandingPageRepo = new Mock<ILandingPageRepository>();
            var mockCloudinaryRepo = new Mock<ICloudinaryRepository>();
            var mockBannerFile = new Mock<IFormFile>();
            var landingPageService = new LandingPageService(mockLandingPageRepo.Object, mockCloudinaryRepo.Object, null!, null!);
            var landingPage = new LandingPage { SchoolId = 1 };
            var bannerFile = mockBannerFile.Object;

            mockCloudinaryRepo
                .Setup(c => c.UploadFileAsync(bannerFile, FileConstants.LandingPageBannerUploadPath))
                .ReturnsAsync(string.Empty);

            // Act
            var result = await landingPageService.UpdateLandingPage(
                landingPage,
                bannerFile,
                schoolLogoImage: null,
                landingPageDeleteImages: new List<string>(),
                landingPageNewFiles: new List<IFormFile>());

            // Assert
            Assert.Equal("Không tải được banner trường!", result);
            mockCloudinaryRepo.Verify(
                c => c.UploadFileAsync(bannerFile, FileConstants.LandingPageBannerUploadPath),
                Times.Once);
            mockLandingPageRepo.Verify(r => r.UpdateLandingPageImages(It.IsAny<int>(), It.IsAny<List<string>>()), Times.Never);
            mockLandingPageRepo.Verify(r => r.UpdateLandingPage(It.IsAny<LandingPage>()), Times.Never);
        }

        [Fact]
        public async Task UpdateLandingPage_ShouldReturnError_WhenLogoUploadFails()
        {
            // Arrange
            var mockLandingPageRepo = new Mock<ILandingPageRepository>();
            var mockCloudinaryRepo = new Mock<ICloudinaryRepository>();
            var mockLogoFile = new Mock<IFormFile>();
            var landingPageService = new LandingPageService(mockLandingPageRepo.Object, mockCloudinaryRepo.Object, null!, null!);
            var landingPage = new LandingPage { SchoolId = 1 };
            var logoFile = mockLogoFile.Object;

            mockCloudinaryRepo
                .Setup(c => c.UploadFileAsync(logoFile, FileConstants.LandingPageLogoUploadPath))
                .ReturnsAsync(string.Empty);

            // Act
            var result = await landingPageService.UpdateLandingPage(
                landingPage,
                bannerImage: null,
                schoolLogoImage: logoFile,
                landingPageDeleteImages: new List<string>(),
                landingPageNewFiles: new List<IFormFile>());

            // Assert
            Assert.Equal("Không tải được logo trường!", result);

            mockCloudinaryRepo.Verify(
                c => c.UploadFileAsync(logoFile, FileConstants.LandingPageLogoUploadPath),
                Times.Once);

            mockLandingPageRepo.Verify(r => r.UpdateLandingPageImages(It.IsAny<int>(), It.IsAny<List<string>>()), Times.Never);
            mockLandingPageRepo.Verify(r => r.UpdateLandingPage(It.IsAny<LandingPage>()), Times.Never);
        }

        [Fact]
        public async Task UpdateLandingPage_ShouldReturnError_WhenNewImageUploadFails()
        {
            // Arrange
            var mockLandingPageRepo = new Mock<ILandingPageRepository>();
            var mockCloudinaryRepo = new Mock<ICloudinaryRepository>();
            var mockLogoImageFile1 = new Mock<IFormFile>();
            var mockLogoImageFile2 = new Mock<IFormFile>();
            var landingPageService = new LandingPageService(mockLandingPageRepo.Object, mockCloudinaryRepo.Object, null!, null!);
            var landingPage = new LandingPage { SchoolId = 1 };
            var newFile1 = mockLogoImageFile1.Object;
            var newFile2 = mockLogoImageFile2.Object;

            // file đầu thành công
            mockCloudinaryRepo
                .Setup(c => c.UploadFileAsync(newFile1, FileConstants.LandingPageImagesUploadPath))
                .ReturnsAsync("url1");

            // file thứ hai fail
            mockCloudinaryRepo
                .Setup(c => c.UploadFileAsync(newFile2, FileConstants.LandingPageImagesUploadPath))
                .ReturnsAsync(string.Empty);

            // Act
            var result = await landingPageService.UpdateLandingPage(
                landingPage,
                bannerImage: null,
                schoolLogoImage: null,
                landingPageDeleteImages: new List<string>(),
                landingPageNewFiles: new List<IFormFile> { newFile1, newFile2 });

            // Assert
            Assert.Equal("Không tải được logo trường!", result);

            mockCloudinaryRepo.Verify(
                c => c.UploadFileAsync(newFile1, FileConstants.LandingPageImagesUploadPath),
                Times.Once);
            mockCloudinaryRepo.Verify(
                c => c.UploadFileAsync(newFile2, FileConstants.LandingPageImagesUploadPath),
                Times.Once);
            mockLandingPageRepo.Verify(r => r.UpdateLandingPageImages(It.IsAny<int>(), It.IsAny<List<string>>()), Times.Never);
            mockLandingPageRepo.Verify(r => r.UpdateLandingPage(It.IsAny<LandingPage>()), Times.Never);
        }

        [Fact]
        public async Task UpdateLandingPage_ShouldReturnError_WhenUpdateLandingPageImagesFails()
        {
            // Arrange
            var mockLandingPageRepo = new Mock<ILandingPageRepository>();
            var mockCloudinaryRepo = new Mock<ICloudinaryRepository>();
            var mockNewFile = new Mock<IFormFile>();
            var landingPageService = new LandingPageService(mockLandingPageRepo.Object, mockCloudinaryRepo.Object, null!, null!);
            var landingPage = new LandingPage { SchoolId = 1 };
            var newFile = mockNewFile.Object;

            mockCloudinaryRepo
                .Setup(c => c.UploadFileAsync(newFile, FileConstants.LandingPageImagesUploadPath))
                .ReturnsAsync("newImageUrl");

            mockLandingPageRepo
                .Setup(r => r.GetLandingPageImages(landingPage.SchoolId))
                .Returns(new List<string> { "old1", "old2" });

            mockLandingPageRepo
                .Setup(r => r.UpdateLandingPageImages(landingPage.SchoolId, It.IsAny<List<string>>()))
                .Returns(false);

            // Act
            var result = await landingPageService.UpdateLandingPage(
                landingPage,
                bannerImage: null,
                schoolLogoImage: null,
                landingPageDeleteImages: new List<string>(),
                landingPageNewFiles: new List<IFormFile> { newFile });

            // Assert
            Assert.Equal("Không lưu được logo trường vào cơ sở dữ liệu!", result);

            mockLandingPageRepo.Verify(r => r.GetLandingPageImages(landingPage.SchoolId), Times.Once);
            mockLandingPageRepo.Verify(
                r => r.UpdateLandingPageImages(
                    landingPage.SchoolId,
                    It.Is<List<string>>(lst => lst.Contains("newImageUrl"))),
                Times.Once);

            mockLandingPageRepo.Verify(r => r.UpdateLandingPage(It.IsAny<LandingPage>()), Times.Never);
        }

        [Fact]
        public async Task UpdateLandingPage_ShouldReturnError_WhenUpdateLandingPageFails()
        {
            // Arrange
            var mockLandingPageRepo = new Mock<ILandingPageRepository>();
            var mockCloudinaryRepo = new Mock<ICloudinaryRepository>();
            var mockNewFile = new Mock<IFormFile>();
            var landingPageService = new LandingPageService(mockLandingPageRepo.Object, mockCloudinaryRepo.Object, null!, null!);
            var landingPage = new LandingPage { SchoolId = 1 };
            var newFile = mockNewFile.Object;

            mockCloudinaryRepo
                .Setup(c => c.UploadFileAsync(newFile, FileConstants.LandingPageImagesUploadPath))
                .ReturnsAsync("newImageUrl");

            mockLandingPageRepo
                .Setup(r => r.GetLandingPageImages(landingPage.SchoolId))
                .Returns(new List<string>());

            mockLandingPageRepo
                .Setup(r => r.UpdateLandingPageImages(landingPage.SchoolId, It.IsAny<List<string>>()))
                .Returns(true);

            mockLandingPageRepo
                .Setup(r => r.UpdateLandingPage(landingPage))
                .Returns(false);

            // Act
            var result = await landingPageService.UpdateLandingPage(
                landingPage,
                bannerImage: null,
                schoolLogoImage: null,
                landingPageDeleteImages: new List<string>(),
                landingPageNewFiles: new List<IFormFile> { newFile });

            // Assert
            Assert.Equal("Có lỗi xảy ra!", result);
            mockLandingPageRepo.Verify(r => r.UpdateLandingPageImages(landingPage.SchoolId, It.IsAny<List<string>>()), Times.Once);
            mockLandingPageRepo.Verify(r => r.UpdateLandingPage(landingPage), Times.Once);
        }

        [Fact]
        public async Task UpdateLandingPage_ShouldSucceedAndReturnEmptyString()
        {
            // Arrange
            var mockLandingPageRepo = new Mock<ILandingPageRepository>();
            var mockCloudinaryRepo = new Mock<ICloudinaryRepository>();
            var mockBannerFile = new Mock<IFormFile>();
            var mockLogoFile = new Mock<IFormFile>();
            var mockImageFile = new Mock<IFormFile>();
            var landingPageService = new LandingPageService(mockLandingPageRepo.Object, mockCloudinaryRepo.Object, null!, null!);
            var landingPage = new LandingPage { SchoolId = 1 };
            var bannerFile = mockBannerFile.Object;
            var logoFile = mockLogoFile.Object;
            var imageFile = mockImageFile.Object;

            mockCloudinaryRepo
                .Setup(c => c.UploadFileAsync(bannerFile, FileConstants.LandingPageBannerUploadPath))
                .ReturnsAsync("bannerUrl");

            mockCloudinaryRepo
                .Setup(c => c.UploadFileAsync(logoFile, FileConstants.LandingPageLogoUploadPath))
                .ReturnsAsync("logoUrl");

            mockCloudinaryRepo
                .Setup(c => c.UploadFileAsync(imageFile, FileConstants.LandingPageImagesUploadPath))
                .ReturnsAsync("newImageUrl");

            mockLandingPageRepo
                .Setup(r => r.GetLandingPageImages(landingPage.SchoolId))
                .Returns(new List<string> { "img1", "img2" });

            mockLandingPageRepo
                .Setup(r => r.UpdateLandingPageImages(landingPage.SchoolId, It.IsAny<List<string>>()))
                .Returns(true);

            mockLandingPageRepo
                .Setup(r => r.UpdateLandingPage(landingPage))
                .Returns(true);

            var deleteImages = new List<string> { "img1" };

            // Act
            var result = await landingPageService.UpdateLandingPage(
                landingPage,
                bannerImage: bannerFile,
                schoolLogoImage: logoFile,
                landingPageDeleteImages: deleteImages,
                landingPageNewFiles: new List<IFormFile> { imageFile });

            // Assert
            Assert.Equal(string.Empty, result);
            Assert.Equal("bannerUrl", landingPage.BannerUrl);
            Assert.Equal("logoUrl", landingPage.SchoolLogoUrl);
            Assert.Equal(new List<string> { "newImageUrl" }, landingPage.LandingPageImages);
            mockLandingPageRepo.Verify(r => r.UpdateLandingPageImages(
                landingPage.SchoolId,
                It.Is<List<string>>(lst =>
                    !lst.Contains("img1") &&
                     lst.Contains("img2") &&
                     lst.Contains("newImageUrl"))
            ), Times.Once);

            mockLandingPageRepo.Verify(r => r.UpdateLandingPage(landingPage), Times.Once);
        }
    }
}
