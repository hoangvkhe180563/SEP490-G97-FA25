using StudyHub.Backend.Api.Controllers;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.Api.Mappers
{
    public static class LandingPageMapper
    {
        public static LandingPage ToLandingPage(this LandingPageUpdateDto dto) => new LandingPage
        {
            SchoolId = dto.SchoolId,
            Description = dto.Description,
            FeaturedDocuments = dto.FeaturedDocumentIds.Select(id => new Document
            {
                Id = id
            }).ToList(),
            FeaturedCourses = dto.FeaturedCourseIds.Select(id => new Course
            {
                Id = id
            }).ToList()
        };

        public static LandingPageDisplayDto ToLandingPageDisplay(this LandingPage landingPage) => new LandingPageDisplayDto
        {
            BannerUrl = landingPage.BannerUrl,
            SchoolLogoUrl = landingPage.SchoolLogoUrl,
            Description = landingPage.Description,
            LandingPageImages = landingPage.LandingPageImages,
            FeaturedTeachers = landingPage.FeaturedTeachers.Select(ft => new LandingPageTeacherDisplayDto
            {
                Name = ft.Fullname ?? "",
                ImageUrl = ft.Avatar ?? ""
            }).ToList(),
            FeaturedDocuments = landingPage.FeaturedDocuments.Select(fd => new LandingPageDocumentDisplayDto
            {
                Id = fd.Id,
                Name = fd.Name,
                Grade = fd.Grade,
                SubjectName = fd.Subject.Name,
                Thumbnail = fd.Thumbnail,
                DocumentCategory = fd.DocumentCategoryId
            }).ToList(),
            FeaturedCourses = landingPage.FeaturedCourses.Select(fc => new LandingPageCourseDisplayDto
            {
                Id = fc.Id,
                Name = fc.Name,
                Grade = fc.Grade,
                SubjectName = fc.Subject.Name,
                Thumbnail = fc.ImageUrl
            }).ToList()
        };

        public static LandingPageListItemDto ToLandingPageListItem(this LandingPage landingPage) => new LandingPageListItemDto
        {
            SchoolId = landingPage.SchoolId,
            SchoolName = landingPage.SchoolName,
            SchoolLogoUrl = landingPage.SchoolLogoUrl
        };
    }
}
