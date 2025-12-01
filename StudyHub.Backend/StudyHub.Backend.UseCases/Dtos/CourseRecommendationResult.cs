using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class CourseRecommendationResult
    {
        public string Id { get; set; } = string.Empty;
        public double Score { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Information { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public uint Price { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public int Grade { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public string Length { get; set; } = string.Empty;
    }
}
