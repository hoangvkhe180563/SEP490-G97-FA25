using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;
using static System.Net.Mime.MediaTypeNames;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class LandingPageRepository : ILandingPageRepository
    {
        private readonly AppDbContext _context;
        public LandingPageRepository(AppDbContext context)
        {
            _context = context;
        }
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
                    return _context.Courses.Where(c => c.IsFeatured && c.SchoolId == null && c.Status == true)
                        .Select(c => new Domain.Entities.Course
                        {
                            Id = c.Id,
                            SchoolId = c.SchoolId,
                            Grade = c.Grade,
                            Name = c.Name,
                            IsFeatured = c.IsFeatured,
                            ImageUrl = c.ImageUrl,
                            Subject = c.Subject != null ? new Domain.Entities.Subject { Id = c.Subject.Id, Name = c.Subject.Name } : null,
                        })
                        .ToList();
                }
                else
                {
                    return _context.Courses.Where(c => c.IsFeatured && c.SchoolId == schoolId && c.Status == true)
                        .Select(c => new Domain.Entities.Course
                        {
                            Id = c.Id,
                            SchoolId = c.SchoolId,
                            Grade = c.Grade,
                            Name = c.Name,
                            IsFeatured = c.IsFeatured,
                            ImageUrl = c.ImageUrl,
                            Subject = c.Subject != null ? new Domain.Entities.Subject { Id = c.Subject.Id, Name = c.Subject.Name } : null,
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
            try
            {
                return []; //TODO: add db column
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
                    return new Domain.Entities.LandingPage
                    {
                        SchoolId = 0,
                        BannerUrl = "/src/uiManagement/assets/banner-image.png",
                        Description = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
                        FeaturedCourses = [],
                        FeaturedDocuments = [],
                        FeaturedTeachers = [],
                        LandingPageImages = []
                    };
                }
                else
                {
                    var landingPageData = _context.LandingPages.First(lp => lp.SchoolId == schoolId);
                    return new Domain.Entities.LandingPage
                    {
                        SchoolId = schoolId,
                        BannerUrl = landingPageData.BannerUrl,
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
                return new Domain.Entities.LandingPage
                {
                    SchoolId = 0,
                    BannerUrl = "/src/uiManagement/assets/banner-image.png",
                    Description = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
                    FeaturedCourses = [],
                    FeaturedDocuments = [],
                    FeaturedTeachers = [],
                    LandingPageImages = []
                };
            }
        }

        public List<string> GetLandingPageImages(int schoolId)
        {
            try
            {
                if (schoolId == 0)
                {
                    return [
                        "/src/common/assets/StudyHubLogo.png",
                        "/src/common/assets/StudyHubLogo.png",
                        "/src/common/assets/StudyHubLogo.png"
                    ];
                }
                else
                {
                    return _context.LandingPageImages.Where(lp => lp.Id == schoolId).Select(lp => lp.ImageUrl).ToList();
                }
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "GetLandingPageImages failed. Inner error: " + ex.Message).LogError();
                return [
                    "/src/common/assets/StudyHubLogo.png",
                    "/src/common/assets/StudyHubLogo.png",
                    "/src/common/assets/StudyHubLogo.png"
                ];
            }
        }

        public bool UpdateLandingPage(Domain.Entities.LandingPage landingPage)
        {
            using var transaction = _context.Database.BeginTransaction();
            try
            {
                var landingPageToUpdate = _context.LandingPages
                    .Include(lp => lp.LandingPageImages)
                    .FirstOrDefault(lp => lp.SchoolId == landingPage.SchoolId);
                if (landingPageToUpdate == null)
                {
                    new InfrastructureException("LandingPageRepository", "UpdateLandingPage failed. Landing Page is null").LogError();
                    return false;
                }

                landingPageToUpdate.BannerUrl = landingPage.BannerUrl;
                landingPageToUpdate.Description = landingPage.Description;

                bool isImageUpdated = UpdateLandingPageImages(landingPage.SchoolId, landingPage.LandingPageImages);
                if (!isImageUpdated)
                {
                    new InfrastructureException("LandingPageRepository", "UpdateLandingPage failed. Images hasn't updated").LogError();
                    return false;
                }

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
            try
            {
                var landingPageImages = _context.LandingPageImages.Where(img => img.LandingPageId == schoolId).ToList();
                //remove existing image
                foreach (var image in landingPageImages)
                {
                    if (images.Contains(image.ImageUrl))
                    {
                        landingPageImages.Remove(image);
                    }
                }

                //add new images
                foreach (var image in images)
                {
                    landingPageImages.Add(new LandingPageImage
                    {
                        LandingPageId = schoolId,
                        ImageUrl = image
                    });
                }

                _context.SaveChanges();

                return true;
            }
            catch (Exception ex)
            {
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
    }
}
