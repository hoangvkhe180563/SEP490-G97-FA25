using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;
using static System.Net.Mime.MediaTypeNames;

namespace StudyHub.Backend.UseCases.Services
{
    public class LandingPageService
    {
        private readonly ILandingPageRepository _repo;
        private readonly ICloudinaryRepository _cloudRepo;
        public LandingPageService(ILandingPageRepository repo, ICloudinaryRepository cloudRepo)
        {
            _repo = repo;
            _cloudRepo = cloudRepo;
        }

        public LandingPage GetGeneralLandingPage()
        {
            var landingPage = _repo.GetLandingPage(0);
            var documents = _repo.GetFeaturedDocuments(0);
            var courses = _repo.GetFeaturedCourses(0);

            //no teachers included
            landingPage.FeaturedDocuments = documents;
            landingPage.FeaturedCourses = courses;
            landingPage.LandingPageImages = Enumerable.Repeat("/src/common/assets/StudyHubLogo.png", 3).ToList();

            return landingPage;
        }

        public List<LandingPage> GetLandingPageList()
        {
            var landingPages = _repo.GetLandingPages();
            return landingPages;
        }

        public LandingPage? GetSchoolLandingPage(int schoolId)
        {
            var landingPage = _repo.GetLandingPage(schoolId);
            var teachers = _repo.GetFeaturedTeachers(schoolId);
            var documents = _repo.GetFeaturedDocuments(schoolId);
            var courses = _repo.GetFeaturedCourses(schoolId);
            var images = _repo.GetLandingPageImages(schoolId);

            landingPage.FeaturedTeachers = teachers;
            landingPage.FeaturedDocuments = documents;
            landingPage.FeaturedCourses = courses;
            landingPage.LandingPageImages = images;

            return landingPage;
        }

        public async Task<string> UpdateLandingPage(LandingPage landingPage, IFormFile? bannerImage, IFormFile? schoolLogoImage, List<string> landingPageDeleteImages, List<IFormFile> landingPageNewFiles)
        {
            if (bannerImage != null)
            {
                string bannerImageUrl = await _cloudRepo.UploadFileAsync(bannerImage, FileConstants.LandingPageBannerUploadPath);
                if (bannerImageUrl == string.Empty)
                {
                    return "Không tải được banner trường!";
                }
                landingPage.BannerUrl = bannerImageUrl;
            }

            if (schoolLogoImage != null)
            {
                string schoolLogoImageUrl = await _cloudRepo.UploadFileAsync(schoolLogoImage, FileConstants.LandingPageLogoUploadPath);
                if (schoolLogoImageUrl == string.Empty)
                {
                    return "Không tải được logo trường!";
                }
                landingPage.SchoolLogoUrl = schoolLogoImageUrl;
            }

            foreach (var images in landingPageDeleteImages)
            {
                bool hasDeleted = await _cloudRepo.DeleteFileAsync(images);
                if (!hasDeleted)
                {
                    return "Không xóa được logo cũ!";
                }
            }

            List<string> landingPageNewImages = new();
            foreach (var file in landingPageNewFiles)
            {
                string fileUrl = await _cloudRepo.UploadFileAsync(file, FileConstants.LandingPageImagesUploadPath);
                if (fileUrl == string.Empty)
                {
                    return "Không tải được logo trường!";
                }
                landingPageNewImages.Add(fileUrl);
            }

            bool isImagesUpdated = _repo.UpdateLandingPageImages(landingPage.SchoolId, landingPageDeleteImages, landingPageNewImages);
            if (!isImagesUpdated)
            {
                return "Không lưu được logo trường vào cơ sở dữ liệu!";
            }

            landingPage.LandingPageImages = landingPageNewImages;
            bool success = _repo.UpdateLandingPage(landingPage);
            return success ? string.Empty : "Có lỗi xảy ra!";
        }
    }
}
