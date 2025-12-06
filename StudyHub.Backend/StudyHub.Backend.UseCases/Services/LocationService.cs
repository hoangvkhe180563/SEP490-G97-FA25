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

        public List<Commune> GetCommunesByCityId(sbyte cityId) => _locationRepository.GetCommunesByCityId(cityId);

        public List<School> GetAllSchools() => _locationRepository.GetAllSchools();

        public List<School> GetSchoolsByCommuneId(int communeId) => _locationRepository.GetSchoolsByCommuneId(communeId);

        public School? GetSchoolById(int? schoolId) => _locationRepository.GetSchoolById(schoolId);

        public Commune? GetCommuneById(int? communeId) => _locationRepository.GetCommuneById(communeId);

        public City? GetCityById(sbyte? cityId) => _locationRepository.GetCityById(cityId);

        public City? GetCityByCommuneId(int? communeId) => _locationRepository.GetCityByCommuneId(communeId);
    }
}
