using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Domain.Entities.Notifications;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Repositories.Notifications
{
    public interface INotificationRepository
    {
        // Notifications (data model)
        Task<Domain.Entities.Notifications.Notification> CreateAsync(Domain.Entities.Notifications.Notification notification, CancellationToken ct = default);
        Task<Domain.Entities.Notifications.Notification?> UpdateAsync(Domain.Entities.Notifications.Notification notification, CancellationToken ct = default);
        Task<Domain.Entities.Notifications.Notification?> GetByIdAsync(Guid id, CancellationToken ct = default);

        Task<List<Domain.Entities.Notifications.Notification>> GetActiveWindowAsync(int take, DateTime now, CancellationToken ct = default);

        Task<List<Domain.Entities.Notifications.Notification>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken ct = default);

        Task DeactivateAsync(Guid notificationId, CancellationToken ct = default);

        // Reads
        Task<Dictionary<Guid, NotificationRead>> GetReadsForUserAsync(Guid userId, IEnumerable<Guid> notificationIds, CancellationToken ct = default);
        Task UpsertReadAsync(Guid notificationId, Guid userId, DateTime readAt, CancellationToken ct = default);
        Task UpsertReadsAsync(IEnumerable<Guid> notificationIds, Guid userId, DateTime readAt, CancellationToken ct = default);
        // Groups
        Task<NotificationGroup> CreateGroupAsync(NotificationGroup group, CancellationToken ct = default);
        Task<NotificationGroup?> GetGroupByIdAsync(int id, CancellationToken ct = default);
        Task<List<NotificationGroup>> GetGroupsForUserAsync(Guid userId, CancellationToken ct = default);
        Task AddUserToGroupAsync(int groupId, Guid userId, CancellationToken ct = default);
        Task RemoveUserFromGroupAsync(int groupId, Guid userId, CancellationToken ct = default);
        List<AppUser>? GetUsersByRoleAndSchool(string roleName, int? schoolId);
        Task<HashSet<Guid>> GetUserRoleIdsAsync(Guid userId, CancellationToken ct = default);
        Task<HashSet<int>> GetUserGroupIdsAsync(Guid userId, CancellationToken ct = default);
        Task SeedUnreadForUsersAsync(Guid notificationId, IEnumerable<Guid> userIds, string? linkurl, CancellationToken ct = default);
    }
}
