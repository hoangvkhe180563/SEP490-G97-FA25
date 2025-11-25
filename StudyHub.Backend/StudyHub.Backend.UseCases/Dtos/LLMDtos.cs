using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Dtos
{
    // LLM Request/Response Models
    public class ChatRequest
    {
        public string UserMessage { get; set; }
        public List<ChatMessage> ConversationHistory { get; set; } = new();
    }

    public class ChatMessage
    {
        public string Role { get; set; } // "user" or "assistant"
        public string Content { get; set; }
    }

    // User Preference Profile (sinh ra từ LLM)
    public class UserPreferenceProfile
    {
        public List<string> Subject { get; set; } = new();
        public string Level { get; set; } // "beginner" | "intermediate" | "advanced"
        public string Goal { get; set; } // "thi vào 10" | "củng cố căn bản" | "luyện đề"
        public string PreferredLength { get; set; } // "short" | "medium" | "long"
        public int Grade { get; set; }
        public List<string> TopicKeywords { get; set; } = new();
    }

    // Recommendation Result
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
