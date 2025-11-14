using System;

namespace StudyHub.Backend.Api.Dtos.SubcriptionDTOS
{
    public class SubscriptionDto
    {
        public int Id { get; set; }
        public Guid AppUserId { get; set; }
        public string? PackageName { get; set; }
        public decimal Price { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class SubscribeDto
    {
        public string? PackageName { get; set; }
        public int Months { get; set; } = 1;
        public decimal Price { get; set; } = 0;
    }
}
