using StudyHub.Backend.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IClassRepository
    {
        List<Class> GetAllClasses(Guid? userid);
        List<Subject> GetAllSubject();
        List<AppUser> GetAllTeacher();
        List<Class> GetClassesByTeacherId(string teacherId);
        Class? GetClassById(int id);
        Class CreateClass(Class classEntity);
        Class UpdateClass(Class classEntity);
        Class? GetClassDetailById(int id);
       
        List<Class> GetClassByUserId(Guid userid);
        List<Class> GetAllClassByUserId(Guid userid);

       
      
    }
}
