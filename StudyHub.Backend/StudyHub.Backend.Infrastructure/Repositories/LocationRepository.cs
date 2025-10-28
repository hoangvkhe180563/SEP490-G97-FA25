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

        public List<DomainEntities.Province> GetProvincesByCityId(sbyte cityId)
        {
            return _context.Provinces
                .Where(p => p.CityId == cityId)
                .Select(p => new DomainEntities.Province
                {
                    Id = p.Id,
                    Name = p.Name,
                    CityId = p.CityId
                }).ToList();
        }

        public List<DomainEntities.Commune> GetCommunesByProvinceId(short provinceId)
        {
            return _context.Communes
                .Where(c => c.ProvinceId == provinceId)
                .Select(c => new DomainEntities.Commune
                {
                    Id = c.Id,
                    Name = c.Name,
                    ProvinceId = c.ProvinceId
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
                ProvinceId = commune.ProvinceId
            };
        }
        public DomainEntities.Province? GetProvinceById(short? provinceId)
        {
            var province = _context.Provinces.Find(provinceId);
            if (province == null) return null;
            return new DomainEntities.Province
            {
                Id = province.Id,
                Name = province.Name,
                CityId = province.CityId
            };
        }
        public DomainEntities.City? GetCityById(short? cityId)
        {
            var city = _context.Cities.Find(cityId);
            if (city == null) return null;
            return new DomainEntities.City
            {
                Id = (sbyte)city.Id,
                Name = city.Name
            };
        }
        public (DomainEntities.Province?, DomainEntities.City?) GetProvinceAndCityByCommuneId(int? communeId)
        {
            var commune = _context.Communes.Find(communeId);
            if (commune == null) return (null, null);
            var province = _context.Provinces.Find(commune.ProvinceId);
            DomainEntities.Province? provinceEntity = null;
            DomainEntities.City? cityEntity = null;
            if (province != null)
            {
                provinceEntity = new DomainEntities.Province
                {
                    Id = province.Id,
                    Name = province.Name,
                    CityId = province.CityId
                };
                var city = _context.Cities.Find(province.CityId);
                if (city != null)
                {
                    cityEntity = new DomainEntities.City
                    {
                        Id = (sbyte)city.Id,
                        Name = city.Name
                    };
                }
            }
            return (provinceEntity, cityEntity);
        }
    }
}
