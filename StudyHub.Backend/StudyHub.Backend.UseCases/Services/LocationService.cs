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
    }
}
