using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class LandingPageRepository : ILandingPageRepository
    {
        private readonly AppDbContext _context;
        public LandingPageRepository(AppDbContext context)
        {
            _context = context;
        }
        private Domain.Entities.LandingPage DEFAULT_LANDING_PAGE = new Domain.Entities.LandingPage
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
        public List<Domain.Entities.Document> GetFeaturedDocuments(int schoolId)
        {
            try
            {
                if (schoolId == 0)
                {
                    return _context.Documents.Where(d => d.IsFeatured && d.SchoolId == null)
                    .Include(d => d.Subject)
                        .Select(d => new Domain.Entities.Document
                        {
                            Id = d.Id,
                            SchoolId = d.SchoolId,
                            Grade = d.Grade,
                            Name = d.Name,
                            Subject = d.Subject != null ? new Domain.Entities.Subject { Id = d.Subject.Id, Name = d.Subject.Name } : null,
                            IsFeatured = d.IsFeatured,
                            DocumentCategoryId = d.DocumentCategoryId,
                            Thumbnail = d.Thumbnail
                        }).ToList();
                }
                else
                {
                    return _context.Documents.Where(d => d.IsFeatured && d.SchoolId == schoolId && d.IsInClass == false && d.Status == true)
                        .Include(d => d.Subject)
                        .Select(d => new Domain.Entities.Document
                        {
                            Id = d.Id,
                            SchoolId = d.SchoolId,
                            Grade = d.Grade,
                            Name = d.Name,
                            Subject = d.Subject != null ? new Domain.Entities.Subject { Id = d.Subject.Id, Name = d.Subject.Name } : null,
                            IsFeatured = d.IsFeatured,
                            DocumentCategoryId = d.DocumentCategoryId,
                            Thumbnail = d.Thumbnail
                        }).ToList();
                }
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "GetFeaturedDocuments failed. Inner error: " + ex.Message).LogError();
                return [];
            }
        }
        public List<Domain.Entities.Course> GetFeaturedCourses(int schoolId)
        {
            try
            {
                if (schoolId == 0)
                {
                    return _context.Courses.Where(c => c.IsFeatured && c.SchoolId == null && c.Status.Equals("Mở"))
                        .Select(c => new Domain.Entities.Course
                        {
                            Id = c.Id,
                            SchoolId = c.SchoolId,
                            Grade = c.Grade,
                            Name = c.Name,
                            IsFeatured = c.IsFeatured,
                            ImageUrl = c.ImageUrl,
                            Subject = new Domain.Entities.Subject { Id = c.Subject.Id, Name = c.Subject.Name }
                        })
                        .ToList();
                }
                else
                {
                    return _context.Courses.Where(c => c.IsFeatured && c.SchoolId == schoolId && c.Status.Equals("Mở"))
                        .Select(c => new Domain.Entities.Course
                        {
                            Id = c.Id,
                            SchoolId = c.SchoolId,
                            Grade = c.Grade,
                            Name = c.Name,
                            IsFeatured = c.IsFeatured,
                            ImageUrl = c.ImageUrl,
                            Subject = new Domain.Entities.Subject { Id = c.Subject.Id, Name = c.Subject.Name },
                        })
                        .ToList();
                }
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "GetFeaturedCourses failed. Inner error: " + ex.Message).LogError();
                return [];
            }
        }

        public List<Domain.Entities.AppUser> GetFeaturedTeachers(int schoolId)
        {
            if (schoolId == 0)
            {
                return [];
            }
            try
            {
                List<Guid> teacherRoleIds = _context.AppRoles.Where(r => r.Name.Contains("Teacher")).Select(r => r.Id).ToList();
                return _context.AppUsers.Where(u => u.Roles.Any(r => teacherRoleIds.Contains(r.Id)) && u.SchoolId == schoolId && u.Status == true && u.IsVerified == true)
                    .Select(u => new Domain.Entities.AppUser
                    {
                        Fullname = u.Fullname,
                        Avatar = u.Avatar,
                    })
                    .Take(5)
                    .ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "GetFeaturedCourses failed. Inner error: " + ex.Message).LogError();
                return [];
            }
        }

        public Domain.Entities.LandingPage GetLandingPage(int schoolId)
        {
            try
            {
                if (schoolId == 0)
                {
                    return DEFAULT_LANDING_PAGE;
                }
                else
                {
                    var landingPageData = _context.LandingPages.First(lp => lp.SchoolId == schoolId);
                    return new Domain.Entities.LandingPage
                    {
                        SchoolId = schoolId,
                        BannerUrl = landingPageData.BannerUrl,
                        SchoolLogoUrl = landingPageData.SchoolLogoUrl,
                        Description = landingPageData.Description,
                        FeaturedCourses = [],
                        FeaturedDocuments = [],
                        FeaturedTeachers = [],
                        LandingPageImages = []
                    };
                }
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "GetLandingPage failed. Inner error: " + ex.Message).LogError();
                return DEFAULT_LANDING_PAGE;
            }
        }

        public List<string> GetLandingPageImages(int schoolId)
        {
            try
            {
                if (schoolId == 0)
                {
                    return [
                        "/StudyHubLogo.png",
                        "/StudyHubLogo.png",
                        "/StudyHubLogo.png"
                    ];
                }
                else
                {
                    return _context.LandingPageImages.Where(lp => lp.LandingPageId == schoolId).Select(lp => lp.ImageUrl).ToList();
                }
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "GetLandingPageImages failed. Inner error: " + ex.Message).LogError();
                return [
                    "/StudyHubLogo.png",
                    "/StudyHubLogo.png",
                    "/StudyHubLogo.png"
                ];
            }
        }

        public bool UpdateLandingPage(Domain.Entities.LandingPage landingPage)
        {
            using var transaction = _context.Database.BeginTransaction();
            try
            {
                var landingPageToUpdate = _context.LandingPages
                    .FirstOrDefault(lp => lp.SchoolId == landingPage.SchoolId);
                if (landingPageToUpdate == null)
                {
                    new InfrastructureException("LandingPageRepository", "UpdateLandingPage failed. Landing Page is null").LogError();
                    return false;
                }

                if (!string.IsNullOrEmpty(landingPage.BannerUrl))
                {
                    landingPageToUpdate.BannerUrl = landingPage.BannerUrl;
                }

                if (!string.IsNullOrEmpty(landingPage.SchoolLogoUrl))
                {
                    landingPageToUpdate.SchoolLogoUrl = landingPage.SchoolLogoUrl;
                }
                landingPageToUpdate.Description = landingPage.Description;

                var documentIds = landingPage.FeaturedDocuments.Select(f => f.Id).ToList();
                bool isDocumentsUpdated = UpdateFeaturedDocuments(landingPage.SchoolId, documentIds);
                if (!isDocumentsUpdated)
                {
                    new InfrastructureException("LandingPageRepository", "UpdateLandingPage failed. Documents hasn't updated").LogError();
                    return false;
                }

                var courseIds = landingPage.FeaturedCourses.Select(c => c.Id).ToList();
                bool isCourseUpdated = UpdateFeaturedCourses(landingPage.SchoolId, courseIds);
                if (!isCourseUpdated)
                {
                    new InfrastructureException("LandingPageRepository", "UpdateLandingPage failed. Courses hasn't updated").LogError();
                    return false;
                }

                transaction.Commit();
                return true;
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                new InfrastructureException("LandingPageRepository", "UpdateLandingPage failed. Inner error: " + ex.Message).LogError();
            }
            return false;
        }

        public bool UpdateLandingPageImages(int schoolId, List<string> images)
        {
            var transaction = _context.Database.BeginTransaction();
            try
            {
                var oldImages = _context.LandingPageImages.Where(lp => lp.LandingPageId == schoolId).ToList();
                _context.LandingPageImages.RemoveRange(oldImages);
                _context.SaveChanges();

                var newImages = images.Select(i => new LandingPageImage
                {
                    LandingPageId = schoolId,
                    ImageUrl = i
                }).ToList();
                _context.LandingPageImages.AddRange(newImages);
                _context.SaveChanges();
                transaction.Commit();
                return true;
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                new InfrastructureException("LandingPageRepository", "UpdateLandingPageImages failed. Inner error: " + ex.Message).LogError();
            }
            return false;
        }


        public bool UpdateFeaturedDocuments(int schoolId, List<int> documentIds)
        {
            try
            {
                var documents = _context.Documents.Where(doc => doc.SchoolId == schoolId && doc.IsInClass == false).ToList();
                foreach (var doc in documents)
                {
                    if (documentIds.Contains(doc.Id))
                    {
                        doc.IsFeatured = true;
                    }
                    else
                    {
                        doc.IsFeatured = false;
                    }
                }

                _context.Documents.UpdateRange(documents);
                _context.SaveChanges();

                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "UpdateFeaturedDocuments failed. Inner error: " + ex.Message).LogError();
            }
            return false;
        }

        public bool UpdateFeaturedCourses(int schoolId, List<int> courseIds)
        {
            try
            {
                var courses = _context.Courses.Where(c => c.SchoolId == schoolId).ToList();
                foreach (var course in courses)
                {
                    if (courseIds.Contains(course.Id))
                    {
                        course.IsFeatured = true;
                    }
                    else
                    {
                        course.IsFeatured = false;
                    }
                }

                _context.Courses.UpdateRange(courses);
                _context.SaveChanges();

                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "UpdateFeaturedCourses failed. Inner error: " + ex.Message).LogError();
            }
            return false;
        }

        public string GetSchoolAddress(int schoolId)
        {
            try
            {
                var school = _context.Schools.FirstOrDefault(s => s.Id == schoolId);
                if (school == null) throw new Exception("School is null");

                int communeId = school.CommuneId;

                Data.Commune commune = _context.Communes.First(c => c.Id == communeId);
                string communeName = commune.Name;
                Data.City city = _context.Cities.First(c => c.Id == commune.CityId);
                string cityName = city.Name;

                return $"{school.Address}, {communeName}, {cityName}";
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "GetSchoolAddress failed. Inner error: " + ex.Message).LogError();
            }
            return string.Empty;
        }

        public List<SchoolListItemDto> GetSchoolList()
        {
            try
            {
                var schools = _context.Schools.Include(s => s.Commune).ThenInclude(c => c.City).ToList();
                var landingPages = _context.LandingPages.ToList();
                if (schools.Count != landingPages.Count)
                {
                    throw new Exception("Number of schools must equal to number of landing pages!");
                }
                List<SchoolListItemDto> schoolList = new List<SchoolListItemDto>();
                for (int i = 0; i < schools.Count; i++)
                {
                    SchoolListItemDto schoolData = new SchoolListItemDto();
                    schoolData.SchoolId = schools[i].Id;
                    schoolData.SchoolName = schools[i].Name;
                    schoolData.CommuneId = schools[i].CommuneId;
                    schoolData.Address = $"{schools[i].Address}, {schools[i].Commune.Name}, {schools[i].Commune.City.Name}";
                    schoolData.Description = landingPages[i].Description;
                    schoolData.BannerUrl = landingPages[i].BannerUrl;
                    schoolData.LogoUrl = landingPages[i].SchoolLogoUrl;
                    schoolList.Add(schoolData);
                }

                return schoolList;
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "GetSchoolList failed. Inner error: " + ex.Message).LogError();
            }
            return [];
        }

        public int AddSchool(Domain.Entities.School school)
        {
            try
            {
                Data.School schoolData = new Data.School
                {
                    Name = school.Name,
                    Address = school.Address,
                    CommuneId = school.CommuneId
                };
                _context.Schools.Add(schoolData);
                _context.SaveChanges();

                //return id to add landing page later
                return schoolData.Id;
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "AddSchool failed. Inner error: " + ex.Message).LogError();
            }
            return 0;
        }

        public int AddLandingPage(Domain.Entities.LandingPage landingPage)
        {
            try
            {
                Data.LandingPage landingPageData = new Data.LandingPage
                {
                    SchoolId = landingPage.SchoolId,
                    BannerUrl = landingPage.BannerUrl,
                    SchoolLogoUrl = landingPage.SchoolLogoUrl,
                    Description = landingPage.Description
                };

                _context.LandingPages.Add(landingPageData);
                _context.SaveChanges();
                return landingPage.SchoolId;
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "AddLandingPage failed. Inner error: " + ex.Message).LogError();
            }
            return 0;
        }

        public bool AddLandingPageImages(int schoolId, List<string> images)
        {
            try
            {
                List<LandingPageImage> landingPageImages = images.Select(image => new LandingPageImage
                {
                    LandingPageId = schoolId,
                    ImageUrl = image
                }).ToList();
                _context.LandingPageImages.AddRange(landingPageImages);
                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "AddLandingPageImages failed. Inner error: " + ex.Message).LogError();
            }
            return false;
        }

        public bool UpdateSchool(Domain.Entities.School school)
        {
            try
            {
                var schoolData = _context.Schools.FirstOrDefault(s => s.Id == school.Id);
                if (schoolData == null) throw new Exception("School is null");

                schoolData.Name = school.Name;
                schoolData.Address = school.Address;
                schoolData.CommuneId = school.CommuneId;

                _context.Schools.Update(schoolData);
                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "UpdateSchool failed. Inner error: " + ex.Message).LogError();
            }
            return false;
        }

        public Domain.Entities.School? GetSchoolById(int schoolId)
        {
            try
            {
                var schoolData = _context.Schools.FirstOrDefault(s => s.Id == schoolId);
                if (schoolData == null) throw new Exception("School is null");

                return new Domain.Entities.School
                {
                    Id = schoolData.Id,
                    Name = schoolData.Name,
                    Address = schoolData.Address,
                    CommuneId = schoolData.CommuneId
                };
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "GetSchoolById failed. Inner error: " + ex.Message).LogError();
            }
            return null;
        }

        public List<Domain.Entities.Document> GetAllDocumentsBySchool(int schoolId)
        {
            try
            {
                var documents = _context.Documents.Include(d => d.Subject).Where(d => d.SchoolId == schoolId && d.IsInClass == false && d.Status == true).ToList();
                return documents.Select(document => new Domain.Entities.Document
                {
                    Id = document.Id,
                    Name = document.Name,
                    Subject = new Domain.Entities.Subject { Id = document.Subject.Id, Name = document.Subject.Name },
                    Grade = document.Grade,
                    IsFeatured = document.IsFeatured,
                }).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "GetSchoolById failed. Inner error: " + ex.Message).LogError();
            }
            return [];
        }
    }
}