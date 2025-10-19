using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ILandingPageRepository
    {
        public List<AppUser> GetFeaturedTeachers(int schoolId);
        public List<Document> GetFeaturedDocuments(int schoolId);
        public List<Course> GetFeaturedCourses(int schoolId);
        public List<string> GetLandingPageImages(int schoolId);
        public LandingPage GetLandingPage(int schoolId);
    }
}
