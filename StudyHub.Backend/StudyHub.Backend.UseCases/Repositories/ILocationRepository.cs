using StudyHub.Backend.Domain.Entities;
using System.Collections.Generic;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ILocationRepository
    {
        List<City> GetAllCities();
        List<Province> GetProvincesByCityId(sbyte cityId);
        List<Commune> GetCommunesByProvinceId(short provinceId);
        List<School> GetAllSchools();
        List<School> GetSchoolsByCommuneId(int communeId);
        School GetSchoolByID(int schoolId);
        Commune CommuneByID(int communeId);
    }
}
