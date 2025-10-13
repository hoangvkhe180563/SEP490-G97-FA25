using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ILessonRepository
    {
        List<Lesson> GetLessonsByChapterId(int chapterId);
        Lesson? GetLessonById(int id);
        Lesson CreateLesson(Lesson lesson);
        Lesson UpdateLesson(Lesson lesson);
        bool DeleteLesson(int id);
    }
}
