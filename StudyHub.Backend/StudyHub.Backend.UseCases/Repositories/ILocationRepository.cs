using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ILocationRepository
    {
        List<City> GetAllCities();
        List<Province> GetProvincesByCityId(sbyte cityId);
        List<Commune> GetCommunesByProvinceId(short provinceId);
        List<School> GetAllSchools();
        List<School> GetSchoolsByCommuneId(int communeId);
        School? GetSchoolById(int? schoolId);
        Commune? GetCommuneById(int? communeId);
        Province? GetProvinceById(short? provinceId);
        City? GetCityById(short? cityId);
        (Province?, City?) GetProvinceAndCityByCommuneId(int? communeId);
    }
}
