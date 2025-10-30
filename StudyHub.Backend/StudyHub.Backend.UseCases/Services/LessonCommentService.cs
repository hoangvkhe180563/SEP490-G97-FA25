using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class LessonCommentService
    {
        private readonly ILessonRepository _lessonRepository;

        public LessonCommentService(ILessonRepository lessonRepository)
        {
            _lessonRepository = lessonRepository;
        }

        public List<LessonComment> GetCommentsByLessonId(int lessonId)
        {
            return _lessonRepository.GetCommentsByLessonId(lessonId);
        }

        public LessonComment? GetCommentById(int id)
        {
            return _lessonRepository.GetCommentById(id);
        }

        public LessonComment CreateComment(LessonComment comment)
        {
            return _lessonRepository.CreateComment(comment);
        }

        public LessonComment UpdateComment(LessonComment comment)
        {
            return _lessonRepository.UpdateComment(comment);
        }

        public bool DeleteComment(int id, Guid userId)
        {
            return _lessonRepository.DeleteComment(id, userId);
        }
    }
}
