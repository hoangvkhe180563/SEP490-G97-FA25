using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class UpsertElasticCourseRequest
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Information { get; set; }
        public string Status { get; set; } = "Mở";
        public sbyte Grade { get; set; }
        public int? SchoolId { get; set; }
        public CourseDifficulty Difficulty { get; set; } = CourseDifficulty.Beginner;
        public CourseLength Length { get; set; } = CourseLength.Short;
        public Subject Subject { get; set; } = null!;
    }
}
