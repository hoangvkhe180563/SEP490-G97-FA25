using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ILessonResourceRepository
    {
        LessonResource? GetById(int id);
        LessonResource Create(LessonResource res);
        LessonResource Update(LessonResource res);
        bool Delete(int id);
    }
}
