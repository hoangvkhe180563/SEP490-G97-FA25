using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class LectureService
    {
        private readonly IChapterRepository _chapterRepo;
        private readonly ILessonRepository _lessonRepo;
        private readonly IInteractiveQuestionRepository _questionRepo;
        private readonly IInteractiveResponseRepository _responseRepo;

        public LectureService(IChapterRepository chapterRepo, ILessonRepository lessonRepo, IInteractiveQuestionRepository questionRepo, IInteractiveResponseRepository responseRepo)
        {
            _chapterRepo = chapterRepo;
            _lessonRepo = lessonRepo;
            _questionRepo = questionRepo;
            _responseRepo = responseRepo;
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

        public List<InteractiveQuestion> GetInteractiveQuestions(int lessonId)
        {
            return _questionRepo.GetByLessonId(lessonId);
        }

        public List<InteractiveQuestion> CreateInteractiveQuestions(int lessonId, List<InteractiveQuestion> questions)
        {
            return _questionRepo.CreateForLesson(lessonId, questions);
        }

        public List<InteractiveQuestion> ReplaceInteractiveQuestions(int lessonId, List<InteractiveQuestion> questions)
        {
            return _questionRepo.ReplaceForLesson(lessonId, questions);
        }

        public InteractiveResponse CreateInteractiveResponse(InteractiveResponse r)
        {
            return _responseRepo.Create(r);
        }
    }
}
