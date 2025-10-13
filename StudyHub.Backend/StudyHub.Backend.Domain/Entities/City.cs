using System.Collections.Generic;

namespace StudyHub.Backend.Domain.Entities
{
    public class City
    {
        public sbyte Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<Province> Provinces { get; set; } = new();
    }
}
