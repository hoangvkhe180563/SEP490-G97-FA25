using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Services
{
    public class ClassService
    {
        private readonly IClassRepository _classRepository;
        public ClassService(IClassRepository classRepository)
        {
            _classRepository = classRepository;
        }
        public List<Class> GetClasses()
        {
            return _classRepository.GetAllClasses();
        }
        public List<Subject> GetSubjects()
        {
            return _classRepository.GetAllSubject();
        }
        public List<AppUser> GetTeachers()
        {
            return _classRepository.GetAllTeacher();
        }
        public Class CreateClass(Class dto)
        {
            var entity = new Class
            {
                Name = dto.Name.Trim(),
                SubjectId = dto.SubjectId,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = dto.CreatedBy
            };

            return _classRepository.CreateClass(entity);
        }
        public Class UpdateClass(Class dto)
        {

            return _classRepository.UpdateClass(dto);
        }
        public Class GetClassById(int id)
        {
            return _classRepository.GetClassById(id);
        }
        public Class? GetClassDetail(int id)
        {
            return _classRepository.GetClassDetailById(id);
        }
        public List<ClassMember> GetClassMembers(int id)
        {
            return _classRepository.GetClassMembers(id);
        }
        public List<ClassNotification> GetClassNotifications(int classId)
        {
            return _classRepository.GetClassNotifications(classId);
        }

    }
}
