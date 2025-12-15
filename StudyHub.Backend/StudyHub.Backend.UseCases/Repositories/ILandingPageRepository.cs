using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ILandingPageRepository
    {
        public List<AppUser> GetFeaturedTeachers(int schoolId);
        public List<Document> GetFeaturedDocuments(int schoolId);
        public List<Course> GetFeaturedCourses(int schoolId);
        public List<string> GetLandingPageImages(int schoolId);
        public LandingPage GetLandingPage(int schoolId);
        public bool UpdateLandingPage(LandingPage landingPage);
        public bool UpdateLandingPageImages(int schoolId, List<string> images);
        public bool UpdateFeaturedDocuments(int schoolId, List<int> documentIds);
        public bool UpdateFeaturedCourses(int schoolId, List<int> courseIds);
        public string GetSchoolAddress(int schoolId);
        List<SchoolDto> GetSchoolList();
        int AddSchool(School school);
        int AddLandingPage(LandingPage landingPage);
        bool UpdateSchool(School school);
        bool AddLandingPageImages(int schoolId, List<string> images);
    }
}
