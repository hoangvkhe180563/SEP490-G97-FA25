using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class UserLearningProfile 
    {
        public string UserId { get; set; }= string.Empty;
        public int SchoolId { get; set; }
        public List<int> CurrentGrades { get; set; } = new();
        public List<string> CurrentSubjectStudied { get; set; } = new();
        public Dictionary<string, float> SubjectStrength { get; set; } = new();
        public Dictionary<string, float> SubjectAccuracy { get; set; } = new();
        public Dictionary<string, float> WorkSpeed { get; set; } = new();
        public Dictionary<string, float> CourseWatchPercentage { get; set; } = new();
    }
}
