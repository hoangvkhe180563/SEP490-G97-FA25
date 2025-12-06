using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ILocationRepository
    {
        List<City> GetAllCities();
        List<Commune> GetCommunesByCityId(sbyte cityId);
        List<School> GetAllSchools();
        List<School> GetSchoolsByCommuneId(int communeId);
        School? GetSchoolById(int? schoolId);
        Commune? GetCommuneById(int? communeId);
        City? GetCityById(sbyte? cityId);
        City? GetCityByCommuneId(int? communeId);
    }
}
