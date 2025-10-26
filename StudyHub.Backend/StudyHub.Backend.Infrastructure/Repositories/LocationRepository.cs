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

        public DomainEntities.School GetSchoolByID(int schoolId)
        {
            var school= _context.Schools.FirstOrDefault(c => c.Id == schoolId);
            return new DomainEntities.School
            {
                Id = schoolId,
                Name = school.Name,
                CommuneId = school.CommuneId,
                Address = school.Address,
                
            };
        }

        public DomainEntities.Commune CommuneByID(int communeId)
        {
            var commune = _context.Communes.FirstOrDefault(c=>c.Id== communeId);
            return new DomainEntities.Commune
            {
                Id = communeId,
                Name = commune.Name,
                ProvinceId = commune.ProvinceId,

            };
        }
    }
}
