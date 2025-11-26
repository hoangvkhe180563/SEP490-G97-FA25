using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class UserPreferenceProfile
    {
        public List<string> Subject { get; set; } = new();
        public string CourseLevel { get; set; } // "beginner" | "intermediate" | "advanced"
        public string DocumentLevel { get; set; } // "beginner" | "intermediate" | "advanced"

        public string Goal { get; set; } // "thi vào 10" | "củng cố căn bản" | "luyện đề"
        public string PreferredLength { get; set; } // "short" | "medium" | "long"
        public int Grade { get; set; }
        public List<string> TopicKeywords { get; set; } = new();
    }
}
