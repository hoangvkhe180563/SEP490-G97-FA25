using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories;

public interface IInteractiveQuestionRepository
{
    List<InteractiveQuestion> GetByLessonId(int lessonId);
    List<InteractiveQuestion> CreateForLesson(int lessonId, List<InteractiveQuestion> questions);
    // Replace all interactive questions for a lesson (delete existing then create new)
    List<InteractiveQuestion> ReplaceForLesson(int lessonId, List<InteractiveQuestion> questions);
}
