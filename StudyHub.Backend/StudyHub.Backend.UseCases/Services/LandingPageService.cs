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

        public LandingPage? GetLandingPageBySchool(int schoolId)
        {
            if (schoolId == 0)
            {
                return _repo.GetLandingPageGeneral();
            }
            return _repo.GetLandingPageBySchool(schoolId);
        }
    }
}
