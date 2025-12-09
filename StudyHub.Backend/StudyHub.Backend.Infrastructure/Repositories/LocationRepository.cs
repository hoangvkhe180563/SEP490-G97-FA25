using System.Collections.Generic;
using System.Linq;
using DomainEntities = StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class LocationRepository : ILocationRepository
    {
        private readonly AppDbContext _context;

        public LocationRepository(AppDbContext context)
        {
            _context = context;
        }

        public List<DomainEntities.City> GetAllCities()
        {
            return _context.Cities.Select(c => new DomainEntities.City
            {
                Id = (sbyte)c.Id,
                Name = c.Name
            }).ToList();
        }

        public List<DomainEntities.Commune> GetCommunesByCityId(sbyte cityId)
        {
            return _context.Communes
                .Where(c => c.CityId == cityId)
                .Select(c => new DomainEntities.Commune
                {
                    Id = c.Id,
                    Name = c.Name,
                    CityId = c.CityId
                }).ToList();
        }

        public List<DomainEntities.School> GetAllSchools()
        {
            return _context.Schools.Select(c => new DomainEntities.School
            {
                Id = (sbyte)c.Id,
                Name = c.Name
            }).ToList();
        }

        public List<DomainEntities.School> GetSchoolsByCommuneId(int communeId)
        {
            return _context.Schools
                .Where(s => s.CommuneId == communeId)
                .Select(s => new DomainEntities.School
                {
                    Id = (sbyte)s.Id,
                    Name = s.Name,
                }).ToList();
        }




        public DomainEntities.School? GetSchoolById(int? schoolId)
        {
            var school = _context.Schools.Find(schoolId);
            if (school == null) return null;
            return new DomainEntities.School
            {
                Id = (sbyte)school.Id,
                Name = school.Name,
            };
        }

        public DomainEntities.Commune? GetCommuneById(int? communeId)
        {
            var commune = _context.Communes.Find(communeId);
            if (commune == null) return null;
            return new DomainEntities.Commune
            {
                Id = commune.Id,
                Name = commune.Name,
                CityId = commune.CityId
            };
        }

        public DomainEntities.City? GetCityById(sbyte? cityId)
        {
            var city = _context.Cities.Find(cityId);
            if (city == null) return null;
            return new DomainEntities.City
            {
                Id = (sbyte)city.Id,
                Name = city.Name
            };
        }

        public DomainEntities.City? GetCityByCommuneId(int? communeId)
        {
            var commune = _context.Communes.Find(communeId);
            if (commune == null) return null;

            var city = _context.Cities.Find(commune.CityId);
            if (city == null) return null;

            return new DomainEntities.City
            {
                Id = (sbyte)city.Id,
                Name = city.Name
            };
        }
    }
}
