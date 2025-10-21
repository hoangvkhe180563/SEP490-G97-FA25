using StudyHub.Backend.Api.Controllers;
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
    }
}
