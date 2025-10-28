using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using System.Collections.Generic;

namespace StudyHub.Backend.UseCases.Services
{
    public class LocationService
    {
        private readonly ILocationRepository _locationRepository;

        public LocationService(ILocationRepository locationRepository)
        {
            _locationRepository = locationRepository;
        }

        public List<City> GetAllCities() => _locationRepository.GetAllCities();

        public List<Province> GetProvincesByCityId(sbyte cityId) => _locationRepository.GetProvincesByCityId(cityId);

        public List<Commune> GetCommunesByProvinceId(short provinceId) => _locationRepository.GetCommunesByProvinceId(provinceId);

        public List<School> GetAllSchools() => _locationRepository.GetAllSchools();

        public List<School> GetSchoolsByCommuneId(int communeId) => _locationRepository.GetSchoolsByCommuneId(communeId);

        public School? GetSchoolById(int? schoolId) => _locationRepository.GetSchoolById(schoolId);

        public Commune? GetCommuneById(int? communeId) => _locationRepository.GetCommuneById(communeId);
        public Province? GetProvinceById(short? provinceId) => _locationRepository.GetProvinceById(provinceId);
        public City? GetCityById(short? cityId) => _locationRepository.GetCityById(cityId);
        public (Province? ProvinceName, City? CityName) GetProvinceAndCityByCommuneId(int? communeId)
        {
            var (province, city) = _locationRepository.GetProvinceAndCityByCommuneId(communeId);
            return (province, city);
        }
    }
}
