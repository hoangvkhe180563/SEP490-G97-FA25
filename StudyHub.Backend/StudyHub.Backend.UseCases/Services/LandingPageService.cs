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
        private readonly ILocationRepository _locationRepo;
        public LandingPageService(ILandingPageRepository repo, ICloudinaryRepository cloudRepo, IPaymentInfoRepository paymentInfoRepo, ILocationRepository locationRepo)
        {
            _landingPageRepo = repo;
            _cloudRepo = cloudRepo;
            _paymentInfoRepo = paymentInfoRepo;
            _locationRepo = locationRepo;
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

        public List<SchoolListItemDto> GetSchoolList()
        {
            return _landingPageRepo.GetSchoolList();
        }

        public async Task<bool> AddSchool(SchoolCreateDto schoolDto)
        {
            if (schoolDto.CommuneId <= 0)
            {
                new UseCaseException("LandingPageService", "[AddSchool] Id quận/huyện phải > 0!").LogError();
                return false;
            }
            if (schoolDto.Banner.Length == 0 || schoolDto.Logo.Length == 0 || schoolDto.NewLandingPageImages.Any(img => img.Length == 0))
            {
                new UseCaseException("LandingPageService", "[AddSchool] Không có dữ liệu cho 1 trong các file hình ảnh!").LogError();
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
                new UseCaseException("LandingPageService", "[AddSchool] Không thêm được dữ liệu trường!").LogError();
                return false;
            }

            //2. upload file
            string bannerImageUrl = await _cloudRepo.UploadFileAsync(schoolDto.Banner, FileConstants.LandingPageBannerUploadPath);
            if (bannerImageUrl == string.Empty)
            {
                new UseCaseException("LandingPageService", "[AddSchool] Không tải được banner trường!").LogError();
                return false;
            }

            string schoolLogoImageUrl = await _cloudRepo.UploadFileAsync(schoolDto.Logo, FileConstants.LandingPageLogoUploadPath);
            if (schoolLogoImageUrl == string.Empty)
            {
                new UseCaseException("LandingPageService", "[AddSchool] Không tải được logo trường!").LogError();
                return false;
            }

            List<string> landingPageNewImages = new();
            foreach (var file in schoolDto.NewLandingPageImages)
            {
                string fileUrl = await _cloudRepo.UploadFileAsync(file, FileConstants.LandingPageImagesUploadPath);
                if (fileUrl == string.Empty)
                {
                    new UseCaseException("LandingPageService", "[AddSchool] Không tải được ảnh giới thiệu trường!").LogError();
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
                new UseCaseException("LandingPageService", "[AddSchool] Không thêm được dữ liệu giao diện!").LogError();
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
                new UseCaseException("LandingPageService", "[AddSchool] Không thêm được dữ liệu thông tin tài khoản!").LogError();
                return false;
            }
            return true;
        }

        public SchoolEditFormDto? GetSchoolById(int schoolId)
        {
            if (schoolId == 0) return null;
            var schoolEntity = _landingPageRepo.GetSchoolById(schoolId);
            if (schoolEntity == null)
            {
                new UseCaseException("LandingPageService", "[GetSchoolById] Không lấy được dữ liệu trường!").LogError();
                return null;
            }

            var landingPageEntity = _landingPageRepo.GetLandingPage(schoolId);
            var landingPageDocuments = _landingPageRepo.GetFeaturedDocuments(schoolId);
            var landingPageCourses = _landingPageRepo.GetFeaturedCourses(schoolId);
            var landingPageImages = _landingPageRepo.GetLandingPageImages(schoolId);
            landingPageEntity.FeaturedDocuments = landingPageDocuments;
            landingPageEntity.FeaturedCourses = landingPageCourses;
            landingPageEntity.LandingPageImages = landingPageImages;
            if (landingPageEntity == null)
            {
                new UseCaseException("LandingPageService", "[GetSchoolById] Không lấy được dữ liệu cấu hình trang chủ!").LogError();
                return null;
            }

            var paymentInfoEntity = _paymentInfoRepo.GetBySchoolId(schoolId);
            if (paymentInfoEntity == null)
            {
                new UseCaseException("LandingPageService", "[GetSchoolById] Không lấy được dữ liệu tài khoản!").LogError();
                return null;
            }

            var cityEntity = _locationRepo.GetCityByCommuneId(schoolEntity.CommuneId);
            if (cityEntity == null)
            {
                new UseCaseException("LandingPageService", "[GetSchoolById] Không lấy được tên thành phố!").LogError();
                return null;
            }

            return new SchoolEditFormDto
            {
                Id = schoolId,
                SchoolName = schoolEntity.Name,
                CommuneId = schoolEntity.CommuneId,
                CityId = cityEntity.Id,
                BannerUrl = landingPageEntity.BannerUrl,
                LogoUrl = landingPageEntity.SchoolLogoUrl,
                Description = landingPageEntity.Description,
                Address = schoolEntity.Address,
                LandingPageImages = landingPageImages,
                FeaturedDocumentIds = landingPageDocuments.Select(d => d.Id).ToList(),
                FeaturedCourseIds = landingPageCourses.Select(c => c.Id).ToList(),
                AccountName = paymentInfoEntity.AccountName,
                AccountBank = paymentInfoEntity.AccountBank,
                ExchangeRate = paymentInfoEntity.ExchangeRate,
                AccountNumber = paymentInfoEntity.AccountNumber,
            };
        }

        public async Task<bool> UpdateSchool(SchoolUpdateDto schoolDto)
        {
            if (schoolDto.Id == 0)
            {
                new UseCaseException("LandingPageService", "[UpdateSchool] Chưa có id trường!").LogError();
                return false;
            }
            if (schoolDto.NewLandingPageImages.Any(img => img.Length == 0) || (schoolDto.CurrentLandingPageImages.Count == 0 && schoolDto.NewLandingPageImages.Count == 0))
            {
                new UseCaseException("LandingPageService", "[UpdateSchool] Chưa có ảnh giới thiệu trường!").LogError();
                return false;
            }

            //1. update school
            School school = new School
            {
                Id = schoolDto.Id,
                Name = schoolDto.SchoolName,
                Address = schoolDto.Address,
                CommuneId = schoolDto.CommuneId,
            };

            bool isSchoolUpdated = _landingPageRepo.UpdateSchool(school);
            if (!isSchoolUpdated)
            {
                new UseCaseException("LandingPageService", "[UpdateSchool] Không cập nhật được dữ liệu trường!").LogError();
                return false;
            }

            LandingPage landingPage = new LandingPage();
            landingPage.SchoolId = schoolDto.Id;
            //2. upload file
            List<string> newLandingPageImages = new();
            foreach (var file in schoolDto.NewLandingPageImages)
            {
                string fileUrl = await _cloudRepo.UploadFileAsync(file, FileConstants.LandingPageImagesUploadPath);
                if (fileUrl == string.Empty)
                {
                    new UseCaseException("LandingPageService", "[UpdateSchool] Không tải được ảnh giới thiệu trường!").LogError();
                    return false;
                }
                newLandingPageImages.Add(fileUrl);
            }
            newLandingPageImages.AddRange(schoolDto.CurrentLandingPageImages);

            bool isImagesUpdated = _landingPageRepo.UpdateLandingPageImages(landingPage.SchoolId, newLandingPageImages);
            if (!isImagesUpdated)
            {
                new UseCaseException("LandingPageService", "[UpdateSchool] Không lưu được logo trường vào cơ sở dữ liệu!").LogError();
                return false;
            }

            if (schoolDto.Banner != null)
            {
                string bannerImageUrl = await _cloudRepo.UploadFileAsync(schoolDto.Banner, FileConstants.LandingPageBannerUploadPath);
                if (bannerImageUrl == string.Empty)
                {
                    new UseCaseException("LandingPageService", "[UpdateSchool] Không tải được banner trường!").LogError();
                    return false;
                }
                landingPage.BannerUrl = bannerImageUrl;
            }

            if (schoolDto.Logo != null)
            {
                string schoolLogoImageUrl = await _cloudRepo.UploadFileAsync(schoolDto.Logo, FileConstants.LandingPageLogoUploadPath);
                if (schoolLogoImageUrl == string.Empty)
                {
                    new UseCaseException("LandingPageService", "[UpdateSchool] Không tải được logo trường!").LogError();
                    return false;
                }
                landingPage.SchoolLogoUrl = schoolLogoImageUrl;
            }

            //3. update landing page
            landingPage.Description = schoolDto.Description;
            landingPage.FeaturedDocuments = schoolDto.FeaturedDocumentIds.Select(did => new Document { Id = did }).ToList();
            landingPage.FeaturedCourses = schoolDto.FeaturedCourseIds.Select(cid => new Course { Id = cid }).ToList();

            bool isLandingPageUpdated = _landingPageRepo.UpdateLandingPage(landingPage);
            if (!isLandingPageUpdated)
            {
                new UseCaseException("LandingPageService", "[UpdateSchool] Không cập nhật được dữ liệu trường!").LogError();
                return false;
            }
            //4. update payment info
            PaymentInfo paymentInfo = new PaymentInfo()
            {
                SchoolId = landingPage.SchoolId,
                AccountNumber = schoolDto.AccountNumber,
                AccountName = schoolDto.AccountName,
                AccountBank = schoolDto.AccountBank,
                ExchangeRate = schoolDto.ExchangeRate,
                QrcodeUrl = $"https://qr.sepay.vn/img?acc={schoolDto.AccountNumber}&bank={schoolDto.AccountBank}&template=compact"
            };
            bool isPaymentInfoUpdated = _paymentInfoRepo.UpdatePaymentInfo(paymentInfo);
            if (!isPaymentInfoUpdated)
            {
                new UseCaseException("LandingPageService", "[UpdateSchool] Không cập nhật được dữ liệu thông tin tài khoản!").LogError();
                return false;
            }
            return true;
        }

        public List<Document> GetAllDocumentsBySchool(int schoolId)
        {
            if (schoolId == 0)
            {
                return [];
            }
            return _landingPageRepo.GetAllDocumentsBySchool(schoolId);
        }
    }
}
