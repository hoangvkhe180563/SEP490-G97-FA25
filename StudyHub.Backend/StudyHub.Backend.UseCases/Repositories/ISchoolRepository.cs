using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ISchoolRepository
    {
        public School GetSchoolInfo(int id);
        public School UpdateSchoolInfo(School school);
        public School CreateSchoolInfo(School school);
        public bool DeleteSchoolInfo(int id);
        public School GetSchoolById(int id);
        public School GetSchoolByName(string name);
        public List<School> GetAllSchools();
    }
}
