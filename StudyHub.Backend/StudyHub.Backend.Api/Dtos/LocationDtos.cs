using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class CityDto
    {
        public sbyte Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class ProvinceDto
    {
        public short Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public sbyte CityId { get; set; }
    }

    public class CommuneDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public short ProvinceId { get; set; }
    }

    public class SchoolDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
}
