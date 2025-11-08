using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public class ImageModerationResult
    {
        public bool IsViolation { get; set; }
        public string? ViolationType { get; set; }
        public string? Likelihood { get; set; }
        public string? Details { get; set; }
        public Dictionary<string, double> AllScores { get; set; } = new();
    }
}
