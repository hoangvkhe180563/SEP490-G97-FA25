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
        public string ImageUrl { get; set; } = string.Empty;
        public uint Price { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid CreatedById { get; set; }
        public string? Information { get; set; }
        public string Status { get; set; } = "Mở";
        public int? SchoolId { get; set; }
        public Subject Subject { get; set; } = null!;
        public CourseDifficulty Difficulty { get; set; } = CourseDifficulty.Beginner;
        public CourseLength Length { get; set; } = CourseLength.Short;
        public sbyte Grade { get; set; }
    }
}
