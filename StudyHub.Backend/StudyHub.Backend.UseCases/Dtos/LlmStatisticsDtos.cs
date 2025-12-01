using System;
using System.Collections.Generic;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class StudentQuestionStatsDto
    {
        public Guid UserId { get; set; }
        public string? FullName { get; set; }
        public int TotalQuestions { get; set; }
    }

    public class SubjectCountDto
    {
        public string Subject { get; set; } = null!;
        public int Count { get; set; }
    }

    public class TokenSummaryDto
    {
        public long TotalInputTokens { get; set; }
        public long TotalOutputTokens { get; set; }
        public long TotalTokens => TotalInputTokens + TotalOutputTokens;
        public double AverageTokensPerQuestion { get; set; }
    }

    public class DateTokenDto
    {
        public string Period { get; set; } = null!; // e.g., 2025-11
        public long Tokens { get; set; }
    }

    public class UserTokenDto
    {
        public Guid UserId { get; set; }
        public string? FullName { get; set; }
        public long TotalTokens { get; set; }
    }
}
