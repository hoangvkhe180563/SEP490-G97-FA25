using System.Collections.Generic;

namespace StudyHub.Backend.Domain.Entities
{
    public class Province
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int CityId { get; set; }
        public City? City { get; set; }
    }
}
