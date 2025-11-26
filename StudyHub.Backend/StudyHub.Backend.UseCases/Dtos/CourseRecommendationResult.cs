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
        public string Title { get; set; } = string.Empty;
        public double Score { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public string Length { get; set; } = string.Empty;
        public string Information { get; set; } = string.Empty;
        public int Grade { get; set; }
    }
}
