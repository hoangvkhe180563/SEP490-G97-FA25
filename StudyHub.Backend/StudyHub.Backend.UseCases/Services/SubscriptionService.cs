using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services;

public class SubscriptionService
{
    private readonly ISubscriptionRepository _repo;

    public SubscriptionService(ISubscriptionRepository repo)
    {
        _repo = repo;
    }

    public Subscription CreateSubscription(Subscription s)
    {
        return _repo.Create(s);
    }

    public Subscription? GetActiveSubscription(Guid userId)
    {
        return _repo.GetActiveByUser(userId);
    }
}
