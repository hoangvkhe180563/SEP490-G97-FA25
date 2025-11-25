using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class CourseRecommendationResult
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public double Score { get; set; }
        public string Reason { get; set; }
        public string Subject { get; set; }
        public string Difficulty { get; set; }
        public string Length { get; set; }
        public string Information { get; set; }
        public int Grade { get; set; }
    }
}
