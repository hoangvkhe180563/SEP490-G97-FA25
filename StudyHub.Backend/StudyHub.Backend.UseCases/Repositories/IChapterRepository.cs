using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IChapterRepository
    {
        List<Chapter> GetChaptersByCourseId(int courseId);
        Chapter? GetChapterById(int id);
        Chapter CreateChapter(Chapter chapter);
        Chapter UpdateChapter(Chapter chapter);
        bool DeleteChapter(int id);
    }
}
