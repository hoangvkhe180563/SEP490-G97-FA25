using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.Infrastructure.Data;

namespace StudyHub.Backend.Infrastructure.Repositories;

public class SubscriptionRepository : ISubscriptionRepository
{
    private readonly AppDbContext _context;

    public SubscriptionRepository(AppDbContext context)
    {
        _context = context;
    }

    public Domain.Entities.Subscription Create(Domain.Entities.Subscription subscription)
    {
        var ent = new Subscription
        {
            AppUserId = subscription.AppUserId,
            PackageName = subscription.PackageName,
            Price = subscription.Price,
            StartAt = subscription.StartAt,
            EndAt = subscription.EndAt,
            IsActive = subscription.IsActive,
            CreatedAt = subscription.CreatedAt == default ? DateTime.Now : subscription.CreatedAt
        };
         _context.Subscriptions.Add(ent);
        _context.SaveChanges();

        subscription.Id = ent.Id;
        return subscription;
    }

    public Domain.Entities.Subscription? GetActiveByUser(Guid appUserId)
    {
        var now = DateTime.Now;
        var ent = _context.Subscriptions
            .Where(s => s.AppUserId == appUserId && s.IsActive.HasValue && s.StartAt <= now && s.EndAt >= now)
            .OrderByDescending(s => s.StartAt)
            .FirstOrDefault();
        if (ent == null) return null;
        return new Domain.Entities.Subscription
        {
            Id = ent.Id,
            AppUserId = ent.AppUserId,
            PackageName = ent.PackageName,
            Price = ent.Price,
            StartAt = ent.StartAt,
            EndAt = ent.EndAt,
            IsActive = ent.IsActive.HasValue,
            CreatedAt = ent.CreatedAt
        };
    }
}
