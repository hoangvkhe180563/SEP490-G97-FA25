using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories;

public interface ISubscriptionRepository
{
    Subscription Create(Subscription subscription);
    Subscription? GetActiveByUser(Guid appUserId);
}
