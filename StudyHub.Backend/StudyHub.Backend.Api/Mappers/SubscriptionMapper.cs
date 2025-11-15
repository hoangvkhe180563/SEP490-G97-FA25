using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos.SubcriptionDTOS;

namespace StudyHub.Backend.Api.Mappers
{
    public static class SubscriptionMapper
    {
        public static SubscriptionDto ToDto(this Subscription s) => new SubscriptionDto
        {
            Id = s.Id,
            AppUserId = s.AppUserId,
            PackageName = s.PackageName,
            Price = s.Price,
            StartAt = s.StartAt,
            EndAt = s.EndAt,
            IsActive = s.IsActive,
            CreatedAt = s.CreatedAt
        };
    }
}
