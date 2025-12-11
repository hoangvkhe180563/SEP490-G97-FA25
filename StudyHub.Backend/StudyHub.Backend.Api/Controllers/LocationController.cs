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

        // GET: api/location/cities
        [HttpGet("cities")]
        public IActionResult GetCities()
        {
            var cities = _locationService.GetAllCities()
                .Select(c => new CityDto { Id = c.Id, Name = c.Name })
                .ToList();
            return Ok(cities);
        }

        // GET: api/location/cities/1/communes
        [HttpGet("cities/{cityId}/communes")]
        public IActionResult GetCommunesByCityId(sbyte cityId)
        {
            var communes = _locationService.GetCommunesByCityId(cityId)
                .Select(c => new CommuneDto { Id = c.Id, Name = c.Name, CityId = c.CityId })
                .ToList();
            return Ok(communes);
        }

        // GET: api/location/schools
        [HttpGet("schools")]
        public IActionResult GetSchools()
        {
            var schools = _locationService.GetAllSchools()
                .Select(s => new SchoolDto { Id = s.Id, Name = s.Name })
                .ToList();
            return Ok(schools);
        }

        //GET: api/location/communes/1/schools
        [HttpGet("communes/{communeId}/schools")]
        public IActionResult GetSchoolsByCommuneId(int communeId)
        {
            var communes = _locationService.GetSchoolsByCommuneId(communeId)
                .Select(s => new SchoolDto { Id = s.Id, Name = s.Name })
                .ToList();
            return Ok(communes);
        }
    }
}
