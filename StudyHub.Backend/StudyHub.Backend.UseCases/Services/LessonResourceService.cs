using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class LessonResourceService
    {
        private readonly ILessonResourceRepository _repo;

        public LessonResourceService(ILessonResourceRepository repo)
        {
            _repo = repo;
        }

        public LessonResource? GetById(int id) => _repo.GetById(id);
        public LessonResource Create(LessonResource res) => _repo.Create(res);
        public LessonResource Update(LessonResource res) => _repo.Update(res);
        public bool Delete(int id) => _repo.Delete(id);
    }
}
