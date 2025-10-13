using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ILandingPageRepository
    {
        public LandingPage? GetLandingPageGeneral();
        public LandingPage? GetLandingPageBySchool(int schoolId);
    }
}
