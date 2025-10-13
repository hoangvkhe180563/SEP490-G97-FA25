using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class LectureService
    {
        private readonly IChapterRepository _chapterRepo;
        private readonly ILessonRepository _lessonRepo;

        public LectureService(IChapterRepository chapterRepo, ILessonRepository lessonRepo)
        {
            _chapterRepo = chapterRepo;
            _lessonRepo = lessonRepo;
        }

        public List<Chapter> GetChaptersForCourse(int courseId)
        {
            return _chapterRepo.GetChaptersByCourseId(courseId);
        }

        public Chapter? GetChapter(int id) => _chapterRepo.GetChapterById(id);

        public Chapter CreateChapter(Chapter ch) => _chapterRepo.CreateChapter(ch);

        public Chapter UpdateChapter(Chapter ch) => _chapterRepo.UpdateChapter(ch);

        public bool DeleteChapter(int id) => _chapterRepo.DeleteChapter(id);

        public List<Lesson> GetLessonsForChapter(int chapterId) => _lessonRepo.GetLessonsByChapterId(chapterId);

        public Lesson? GetLesson(int id) => _lessonRepo.GetLessonById(id);

        public Lesson CreateLesson(Lesson l) => _lessonRepo.CreateLesson(l);

        public Lesson UpdateLesson(Lesson l) => _lessonRepo.UpdateLesson(l);

        public bool DeleteLesson(int id) => _lessonRepo.DeleteLesson(id);
    }
}
