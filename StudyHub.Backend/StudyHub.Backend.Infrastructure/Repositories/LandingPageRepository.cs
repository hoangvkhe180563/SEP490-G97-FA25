using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;
using System;
using System.Runtime.InteropServices;

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
    }
}
