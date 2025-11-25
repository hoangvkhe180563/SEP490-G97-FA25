using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class SubjectPreference
    {
        public string SubjectName { get; set; }
        public float DifficultyScore { get; set; }
        public CourseDifficulty PreferredDifficulty { get; set; }
        public float LengthPreferenceScore { get; set; }
        public CourseLength PreferredLength { get; set; }
        public float WeakSubjectPriority { get; set; }
    }
}
