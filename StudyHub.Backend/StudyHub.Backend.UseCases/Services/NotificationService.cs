using StudyHub.Backend.Domain.Entities.Notifications;
using StudyHub.Backend.UseCases.Repositories.Notifications;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using DomainNotification = StudyHub.Backend.Domain.Entities.Notifications;

namespace StudyHub.Backend.UseCases.Services
{
    public class NotificationService
    {
        internal readonly INotificationRepository _repo;

        public NotificationService(INotificationRepository repo)
        {
            _repo = repo;
        }

        public class NotificationWithRead
        {
            public DomainNotification.Notification Notification { get; set; } = null!;
            public DomainNotification.NotificationRead? Read { get; set; }
        }

        private static int PriorityRank(string? p)
        {
            return p?.ToLowerInvariant() switch
            {
                "high" => 3,
                "normal" => 2,
                "low" => 1,
                _ => 0
            };
        }

        public async Task<DomainNotification.Notification> SendNotificationAsync(DomainNotification.Notification notification, CancellationToken ct = default)
        {
            if (notification.Id == Guid.Empty) notification.Id = Guid.NewGuid();
            if (notification.CreatedAt == default) notification.CreatedAt = DateTime.Now;
            return await _repo.CreateAsync(notification, ct);
        }

        public async Task<DomainNotification.Notification?> GetNotificationByIdAsync(Guid id, CancellationToken ct = default)
        {
            return await _repo.GetByIdAsync(id, ct);
        }

        public async Task<List<NotificationWithRead>> GetUserNotificationsAsync(Guid userId, bool includeRead = false, int limit = 100, int offset = 0, CancellationToken ct = default)
        {
            var now = DateTime.Now;  
            var window = Math.Clamp(limit + offset + 50, 50, 5000);
            var candidates = await _repo.GetActiveWindowAsync(window, now, ct);

            var userRoles = await _repo.GetUserRoleIdsAsync(userId, ct);
            var userGroups = await _repo.GetUserGroupIdsAsync(userId, ct);

            var filtered = candidates.Where(n =>
                string.Equals(n.TargetType, "All", StringComparison.OrdinalIgnoreCase)
                || (string.Equals(n.TargetType, "User", StringComparison.OrdinalIgnoreCase) && n.TargetUserId.HasValue && n.TargetUserId.Value == userId)
                || (string.Equals(n.TargetType, "Role", StringComparison.OrdinalIgnoreCase) && n.TargetRoleId.HasValue && userRoles.Contains(n.TargetRoleId.Value))
                || (string.Equals(n.TargetType, "Group", StringComparison.OrdinalIgnoreCase) && n.TargetGroupId.HasValue && userGroups.Contains(n.TargetGroupId.Value))
            );

            var ordered = filtered
                .OrderByDescending(n => PriorityRank(n.Priority))
                .ThenByDescending(n => n.CreatedAt)
                .Skip(Math.Max(0, offset))
                .Take(Math.Clamp(limit, 1, 200))
                .ToList();

            var ids = ordered.Select(o => o.Id).ToList();
            var reads = await _repo.GetReadsForUserAsync(userId, ids, ct);

            var result = ordered
                .Select(n =>
                {
                    reads.TryGetValue(n.Id, out var r);
                    return new NotificationWithRead
                    {
                        Notification = n,
                        Read = r
                    };
                })
                .Where(x => includeRead || !(x.Read?.IsRead ?? false))
                .ToList();

            return result;
        }
        public async Task SeedUnreadAsync(Guid notificationId, IEnumerable<Guid> userIds, CancellationToken ct = default)
            => await _repo.SeedUnreadForUsersAsync(notificationId, userIds, ct);
        public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default)
        {
            var now = DateTime.Now;
            var candidates = await _repo.GetActiveWindowAsync(2000, now, ct);

            var userRoles = await _repo.GetUserRoleIdsAsync(userId, ct);
            var userGroups = await _repo.GetUserGroupIdsAsync(userId, ct);

            var filtered = candidates.Where(n =>
                string.Equals(n.TargetType, "All", StringComparison.OrdinalIgnoreCase)
                || (string.Equals(n.TargetType, "User", StringComparison.OrdinalIgnoreCase) && n.TargetUserId.HasValue && n.TargetUserId.Value == userId)
                || (string.Equals(n.TargetType, "Role", StringComparison.OrdinalIgnoreCase) && n.TargetRoleId.HasValue && userRoles.Contains(n.TargetRoleId.Value))
                || (string.Equals(n.TargetType, "Group", StringComparison.OrdinalIgnoreCase) && n.TargetGroupId.HasValue && userGroups.Contains(n.TargetGroupId.Value))
            ).ToList();

            var ids = filtered.Select(n => n.Id).ToList();
            var reads = await _repo.GetReadsForUserAsync(userId, ids, ct);
            return filtered.Count(n => !(reads.TryGetValue(n.Id, out var r) && r.IsRead));
        }

        public async Task MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken ct = default)
            => await _repo.UpsertReadAsync(notificationId, userId, DateTime.Now, ct);

        public async Task MarkAsReadBulkAsync(IEnumerable<Guid> notificationIds, Guid userId, CancellationToken ct = default)
            => await _repo.UpsertReadsAsync(notificationIds, userId, DateTime.Now, ct);

        public async Task DeactivateNotificationAsync(Guid notificationId, CancellationToken ct = default)
            => await _repo.DeactivateAsync(notificationId, ct);

        public async Task<NotificationGroup> CreateGroupAsync(NotificationGroup group, CancellationToken ct = default)
        {
            var domain = new NotificationGroup
            {
                Id = group.Id,
                Name = group.Name,
                Description = group.Description,
                CreatedBy = group.CreatedBy,
                CreatedAt = group.CreatedAt
            };
            return await _repo.CreateGroupAsync(domain, ct);
        }

        public async Task<NotificationGroup?> GetGroupByIdAsync(int id, CancellationToken ct = default)
            => await _repo.GetGroupByIdAsync(id, ct);

        public async Task<List<NotificationGroup>> GetGroupsForUserAsync(Guid userId, CancellationToken ct = default)
            => await _repo.GetGroupsForUserAsync(userId, ct);

        public async Task AddUserToGroupAsync(int groupId, Guid userId, CancellationToken ct = default)
            => await _repo.AddUserToGroupAsync(groupId, userId, ct);

        public async Task RemoveUserFromGroupAsync(int groupId, Guid userId, CancellationToken ct = default)
            => await _repo.RemoveUserFromGroupAsync(groupId, userId, ct);
    }
}