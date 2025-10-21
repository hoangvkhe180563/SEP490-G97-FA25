using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Dtos;
using System.Linq;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LocationController : ControllerBase
    {
        private readonly LocationService _locationService;

        public LocationController(LocationService locationService)
        {
            _locationService = locationService;
        }

        // GET: api/commune/cities
        [HttpGet("cities")]
        public IActionResult GetCities()
        {
            var cities = _locationService.GetAllCities()
                .Select(c => new CityDto { Id = c.Id, Name = c.Name })
                .ToList();
            return Ok(cities);
        }

        // GET: api/commune/provinces?cityId=1
        [HttpGet("provinces")]
        public IActionResult GetProvinces([FromQuery] sbyte cityId)
        {
            var provinces = _locationService.GetProvincesByCityId(cityId)
                .Select(p => new ProvinceDto { Id = p.Id, Name = p.Name, CityId = p.CityId })
                .ToList();
            return Ok(provinces);
        }

        // GET: api/commune/communes?provinceId=1
        [HttpGet("communes")]
        public IActionResult GetCommunes([FromQuery] short provinceId)
        {
            var communes = _locationService.GetCommunesByProvinceId(provinceId)
                .Select(c => new CommuneDto { Id = c.Id, Name = c.Name, ProvinceId = c.ProvinceId })
                .ToList();
            return Ok(communes);
        }

        // GET: api/commune/schools
        [HttpGet("schools")]
        public IActionResult GetSchools()
        {
            var schools = _locationService.GetAllSchools()
                .Select(s => new SchoolDto { Id = s.Id, Name = s.Name })
                .ToList();
            return Ok(schools);
        }
    }
}
