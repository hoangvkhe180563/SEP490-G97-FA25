using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
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

        public Domain.Entities.LandingPage? GetLandingPageGeneral()
        {
            try
            {
                var featuredDocuments = _context.Documents.Include(d => d.Grade).Include(d => d.Subject).Where(d => d.IsFeatured && d.SchoolId == null)
                    .Select(d => new Domain.Entities.Document
                    {
                        Id = d.Id,
                        Thumbnail = d.Thumbnail,
                        GradeName = d.Grade.Name,
                        Subject = d.Subject.Name
                    })
                    .ToList();

                var featuredCourses = _context.Courses.Include(c => c.Grade).Where(c => c.IsFeatured && c.SchoolId == null)
                    .Select(c => new Domain.Entities.Course
                    {
                        Id = c.Id,
                        ImageUrl = c.ImageUrl,
                        Name = c.Name,
                        Grade = c.Grade.Name
                    })
                    .ToList();

                return new Domain.Entities.LandingPage
                {
                    FeaturedDocuments = featuredDocuments,
                    FeaturedCourses = featuredCourses,
                    FeaturedTeachers = [],
                    SchoolLogoUrl = "src/common/assets/StudyHubLogo.png"
                };
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "Cannot connect db. Inner error: " + ex.Message).LogError();
                return null;
            }
        }

        public Domain.Entities.LandingPage? GetLandingPageBySchool(int schoolId)
        {
            try
            {
                var landingPage = _context.LandingPages.Where(lp => lp.SchoolId == schoolId).FirstOrDefault();

                if (landingPage == null)
                {
                    return GetLandingPageGeneral();
                }

                var featuredTeachers = _context.Teachers.Include(t => t.AppUser).Where(t => t.IsFeatured && t.AppUser.SchoolId == schoolId)
                    .Select(t => new Domain.Entities.Teacher
                    {
                        Fullname = t.AppUser.Fullname
                    })
                    .ToList();

                var featuredDocuments = _context.Documents.Include(d => d.Grade).Include(d => d.Subject).Where(d => d.IsFeatured && d.SchoolId == schoolId)
                    .Select(d => new Domain.Entities.Document
                    {
                        Id = d.Id,
                        Thumbnail = d.Thumbnail,
                        GradeName = d.Grade.Name,
                        Subject = d.Subject.Name
                    })
                    .ToList();

                var featuredCourses = _context.Courses.Include(c => c.Grade).Where(c => c.IsFeatured && c.SchoolId == schoolId)
                    .Select(c => new Domain.Entities.Course
                    {
                        Id = c.Id,
                        ImageUrl = c.ImageUrl,
                        Name = c.Name,
                        Grade = c.Grade.Name
                    })
                    .ToList();

                return new Domain.Entities.LandingPage
                {
                    Id = landingPage.Id,
                    SchoolId = schoolId,
                    PrimaryColor = landingPage.PrimaryColor,
                    FeaturedDocuments = featuredDocuments,
                    FeaturedCourses = featuredCourses,
                    FeaturedTeachers = featuredTeachers,
                    SchoolLogoUrl = landingPage.SchoolLogoUrl
                };
            }
            catch (Exception ex)
            {
                new InfrastructureException("LandingPageRepository", "Cannot connect db. Inner error: " + ex.Message).LogError();
                return GetLandingPageGeneral();
            }
        }
    }
}
