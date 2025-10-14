using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class SubjectService
    {
        public readonly ISubjectRepository _subjectRepo;
        public SubjectService(ISubjectRepository subjectRepo)
        {
            _subjectRepo = subjectRepo;
        }
        public List<Subject> GetSubjects()
        {
            return _subjectRepo.GetAllSubjects();
        }
        public Subject? GetSubject(int id)
        {
            return _subjectRepo.GetSubjectById(id);
        }
    }
}
