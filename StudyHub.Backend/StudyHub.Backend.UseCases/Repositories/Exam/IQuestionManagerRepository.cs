using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories.Exam
{
    public interface IQuestionManagerRepository
    {
        public List<Subject> GetSubjectsByManagerId(Guid managerId);
    }
}
