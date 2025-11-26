using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class DocumentSubjectPreference
    {
        public string SubjectName { get; set; } = string.Empty;
        public float DifficultyScore { get; set; }
        public string PreferredDifficulty { get; set; } = string.Empty;
        public float LengthPreferenceScore { get; set; }
        public string PreferredLength { get; set; } = string.Empty;
        public float WeakSubjectPriority { get; set; }
    }
}
