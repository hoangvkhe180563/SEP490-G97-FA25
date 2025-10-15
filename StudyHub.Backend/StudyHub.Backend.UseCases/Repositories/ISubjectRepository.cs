using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ISubjectRepository
    {
        List<Subject> GetAllSubjects();
        Subject? GetSubjectById(int id);
        Subject CreateSubject(Subject subject);
        Subject UpdateSubject(Subject subject);
        bool DeleteSubject(int id);
    }
}
