using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class LandingPageService
    {
        private readonly ILandingPageRepository _repo;
        public LandingPageService(ILandingPageRepository repo)
        {
            _repo = repo;
        }

        public LandingPage? GetLandingPage(int schoolId)
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
    }
}
