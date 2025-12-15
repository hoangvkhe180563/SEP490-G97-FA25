using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Exceptions;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;

namespace StudyHub.Backend.UseCases.Services
{
    public class LandingPageService
    {
        private readonly ILandingPageRepository _landingPageRepo;
        private readonly IPaymentInfoRepository _paymentInfoRepo;
        private readonly ICloudinaryRepository _cloudRepo;
        public LandingPageService(ILandingPageRepository repo, ICloudinaryRepository cloudRepo, IPaymentInfoRepository paymentInfoRepo)
        {
            _landingPageRepo = repo;
            _cloudRepo = cloudRepo;
            _paymentInfoRepo = paymentInfoRepo;
        }

        public LandingPage GetGeneralLandingPage()
        {
            var landingPage = _landingPageRepo.GetLandingPage(0);
            var documents = _landingPageRepo.GetFeaturedDocuments(0);
            var courses = _landingPageRepo.GetFeaturedCourses(0);

            //no teachers included
            landingPage.FeaturedDocuments = documents;
            landingPage.FeaturedCourses = courses;
            landingPage.LandingPageImages = Enumerable.Repeat("/StudyHubLogo.png", 3).ToList();

            return landingPage;
        }

        public string GetSchoolAddress(int schoolId)
        {
            return _landingPageRepo.GetSchoolAddress(schoolId);
        }

        public LandingPage? GetSchoolLandingPage(int schoolId)
        {
            if (schoolId <= 0)
            {
                return null;
            }
            var landingPage = _landingPageRepo.GetLandingPage(schoolId);
            var teachers = _landingPageRepo.GetFeaturedTeachers(schoolId);
            var documents = _landingPageRepo.GetFeaturedDocuments(schoolId);
            var courses = _landingPageRepo.GetFeaturedCourses(schoolId);
            var images = _landingPageRepo.GetLandingPageImages(schoolId);

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

            List<string> landingPageNewImages = new();
            foreach (var file in landingPageNewFiles)
            {
                string fileUrl = await _cloudRepo.UploadFileAsync(file, FileConstants.LandingPageImagesUploadPath);
                if (fileUrl == string.Empty)
                {
                    return "Không tải được ảnh giới thiệu trường!";
                }
                landingPageNewImages.Add(fileUrl);
            }

            var currentLandingPageImages = _landingPageRepo.GetLandingPageImages(landingPage.SchoolId);
            foreach (var item in landingPageDeleteImages)
            {
                currentLandingPageImages.RemoveAll(item => landingPageDeleteImages.Contains(item));
            }
            currentLandingPageImages.AddRange(landingPageNewImages);

            bool isImagesUpdated = _landingPageRepo.UpdateLandingPageImages(landingPage.SchoolId, currentLandingPageImages);
            if (!isImagesUpdated)
            {
                return "Không lưu được logo trường vào cơ sở dữ liệu!";
            }

            landingPage.LandingPageImages = landingPageNewImages;
            bool success = _landingPageRepo.UpdateLandingPage(landingPage);
            return success ? string.Empty : "Có lỗi xảy ra!";
        }

        public List<SchoolDto> GetSchoolList()
        {
            return _landingPageRepo.GetSchoolList();
        }

        public async Task<bool> AddSchool(SchoolCreateDto schoolDto)
        {
            if (schoolDto.CommuneId <= 0)
            {
                new UseCaseException("LandingPageService", "Id quận/huyện phải > 0!").LogError();
                return false;
            }
            if (schoolDto.Banner.Length == 0 || schoolDto.Logo.Length == 0 || schoolDto.NewLandingPageImages.Any(img => img.Length == 0))
            {
                new UseCaseException("LandingPageService", "Không có dữ liệu cho 1 trong các file hình ảnh!").LogError();
                return false;
            }

            //1. add school
            School school = new School()
            {
                Name = schoolDto.SchoolName.Trim(),
                Address = schoolDto.Address.Trim(),
                CommuneId = schoolDto.CommuneId
            };

            int addedSchoolId = _landingPageRepo.AddSchool(school);
            if (addedSchoolId == 0)
            {
                new UseCaseException("LandingPageService", "Không thêm được dữ liệu trường!").LogError();
                return false;
            }

            //2. upload file
            string bannerImageUrl = await _cloudRepo.UploadFileAsync(schoolDto.Banner, FileConstants.LandingPageBannerUploadPath);
            if (bannerImageUrl == string.Empty)
            {
                new UseCaseException("LandingPageService", "Không tải được banner trường!").LogError();
                return false;
            }

            string schoolLogoImageUrl = await _cloudRepo.UploadFileAsync(schoolDto.Logo, FileConstants.LandingPageLogoUploadPath);
            if (schoolLogoImageUrl == string.Empty)
            {
                new UseCaseException("LandingPageService", "Không tải được logo trường!").LogError();
                return false;
            }

            List<string> landingPageNewImages = new();
            foreach (var file in schoolDto.NewLandingPageImages)
            {
                string fileUrl = await _cloudRepo.UploadFileAsync(file, FileConstants.LandingPageImagesUploadPath);
                if (fileUrl == string.Empty)
                {
                    new UseCaseException("LandingPageService", "Không tải được ảnh giới thiệu trường!").LogError();
                    return false;
                }
                landingPageNewImages.Add(fileUrl);
            }

            //3. add landing page
            LandingPage landingPage = new LandingPage()
            {
                BannerUrl = bannerImageUrl,
                SchoolLogoUrl = schoolLogoImageUrl,
                Description = schoolDto.Description.Trim(),
                SchoolId = addedSchoolId
            };
            int landingPageId = _landingPageRepo.AddLandingPage(landingPage);
            if (landingPageId == 0)
            {
                new UseCaseException("LandingPageService", "Không thêm được dữ liệu giao diện!").LogError();
                return false;
            }
            bool isLandingPageImagesAdded = _landingPageRepo.AddLandingPageImages(addedSchoolId, landingPageNewImages);

            //4. add payment info
            PaymentInfo paymentInfo = new PaymentInfo()
            {
                SchoolId = addedSchoolId,
                AccountName = schoolDto.AccountName.Trim(),
                AccountBank = schoolDto.AccountBank.Trim(),
                AccountNumber = schoolDto.AccountNumber.Trim(),
                ExchangeRate = schoolDto.ExchangeRate,
                QrcodeUrl = $"https://qr.sepay.vn/img?acc={schoolDto.AccountNumber}&bank={schoolDto.AccountBank}&template=compact"
            };
            bool isPaymentInfoAdded = _paymentInfoRepo.AddPaymentInfo(paymentInfo);
            if (!isPaymentInfoAdded)
            {
                new UseCaseException("LandingPageService", "Không thêm được dữ liệu thông tin tài khoản!").LogError();
                return false;
            }
            return true;
        }
    }
}
