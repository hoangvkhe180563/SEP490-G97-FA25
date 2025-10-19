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
            return null;
            //try
            //{
            //    var featuredDocuments = _context.Documents.Include(d => d.Grade).Include(d => d.Subject).Where(d => d.IsFeatured && d.SchoolId == null)
            //        .Select(d => new Domain.Entities.Document
            //        {
            //            Id = d.Id,
            //            Thumbnail = d.Thumbnail,
            //        })
            //        .ToList();

            //    var featuredCourses = _context.Courses.Include(c => c.Grade).Where(c => c.IsFeatured && c.SchoolId == null)
            //        .Select(c => new Domain.Entities.Course
            //        {
            //            Id = c.Id,
            //            ImageUrl = c.ImageUrl,
            //            Name = c.Name,
            //            Grade = c.Grade
            //        })
            //        .ToList();

            //    return new Domain.Entities.LandingPage
            //    {
            //        SchoolLogoUrl = "src/common/assets/StudyHubLogo.png"
            //    };
            //}
            //catch (Exception ex)
            //{
            //    new InfrastructureException("LandingPageRepository", "Cannot connect db. Inner error: " + ex.Message).LogError();
            //    return null;
            //}
        }

        public Domain.Entities.LandingPage? GetLandingPageBySchool(int schoolId)
        {
            return null;
            //try
            //{
            //    var landingPage = _context.LandingPages.Where(lp => lp.SchoolId == schoolId).FirstOrDefault();

            //    if (landingPage == null)
            //    {
            //        return GetLandingPageGeneral();
            //    }

            //    var featuredTeachers = _context.AppUsers.Where(a => a.SchoolId == schoolId)
            //        .Select(t => new Domain.Entities.Teacher
            //        {
            //            Fullname = t.AppUser.Fullname
            //        })
            //        .ToList();

            //    var featuredDocuments = _context.Documents.Include(d => d.Grade).Include(d => d.Subject).Where(d => d.IsFeatured && d.SchoolId == schoolId)
            //        .Select(d => new Domain.Entities.Document
            //        {
            //            Id = d.Id,
            //            Thumbnail = d.Thumbnail,
            //            Grade = d.Grade,
            //        })
            //        .ToList();

            //    var featuredCourses = _context.Courses.Include(c => c.Grade).Where(c => c.IsFeatured && c.SchoolId == schoolId)
            //        .Select(c => new Domain.Entities.Course
            //        {
            //            Id = c.Id,
            //            ImageUrl = c.ImageUrl,
            //            Name = c.Name,
            //            Grade = c.Grade
            //        })
            //        .ToList();

            //    return new Domain.Entities.LandingPage
            //    {
            //        SchoolId = schoolId,
            //        PrimaryColor = landingPage.PrimaryColor,
            //        SchoolLogoUrl = landingPage.SchoolLogoUrl
            //    };
            //}
            //catch (Exception ex)
            //{
            //    new InfrastructureException("LandingPageRepository", "Cannot connect db. Inner error: " + ex.Message).LogError();
            //    return GetLandingPageGeneral();
            //}
        }
    }
}
