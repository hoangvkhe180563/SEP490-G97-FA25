using StudyHub.Backend.Domain.Entities.Notifications;
using StudyHub.Backend.UseCases.Repositories.Notifications;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using DomainNotification = StudyHub.Backend.Domain.Entities.Notifications;
using System.Text.Json;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class NotificationService
    {
        internal readonly INotificationRepository _repo;
        private readonly INotificationOfClassRepository? _notificationOfClassRepo;
        private readonly IAppUserRepository? _appUserRepository;

        // Basic ctor (only persistence/seeding capabilities)
        public NotificationService(INotificationRepository repo)
        {
            _repo = repo ?? throw new ArgumentNullException(nameof(repo));
        }

        public NotificationService(
            INotificationRepository repo,
            INotificationOfClassRepository notificationOfClassRepo,
            IAppUserRepository appUserRepository)
        {
            _repo = repo ?? throw new ArgumentNullException(nameof(repo));
            _notificationOfClassRepo = notificationOfClassRepo;
            _appUserRepository = appUserRepository;
        }

        public class NotificationWithRead
        {
            // use non-nullable Notification but initialize to avoid CS8601 at assignment sites
            public DomainNotification.Notification Notification { get; set; } = new DomainNotification.Notification();
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
            => await _repo.GetByIdAsync(id, ct);

        public async Task<List<NotificationWithRead>> GetUserNotificationsAsync(Guid userId, bool includeRead = false, int limit = 100, int offset = 0, CancellationToken ct = default)
        {
            var now = DateTime.Now;
            var window = Math.Clamp(limit + offset + 50, 50, 5000);

            // protect against repository returning null by coalescing to empty list
            var candidates = (await _repo.GetActiveWindowAsync(window, now, ct)) ?? new List<DomainNotification.Notification>();

            var userRoles = (await _repo.GetUserRoleIdsAsync(userId, ct)) ?? new HashSet<Guid>();
            var userGroups = (await _repo.GetUserGroupIdsAsync(userId, ct)) ?? new HashSet<int>();

            var filtered = candidates.Where(n =>
                string.Equals(n.TargetType, "All", StringComparison.OrdinalIgnoreCase)
                || (string.Equals(n.TargetType, "User", StringComparison.OrdinalIgnoreCase) && n.TargetUserId.HasValue && n.TargetUserId.Value == userId)
                || (string.Equals(n.TargetType, "Role", StringComparison.OrdinalIgnoreCase) && n.TargetRoleId.HasValue && userRoles.Contains(n.TargetRoleId.Value))
                || (string.Equals(n.TargetType, "Group", StringComparison.OrdinalIgnoreCase) && n.TargetGroupId.HasValue && userGroups.Contains(n.TargetGroupId.Value))
            );

            var ordered = filtered
                .OrderByDescending(n => n.CreatedAt)
                .Skip(Math.Max(0, offset))
                .Take(Math.Clamp(limit, 1, 200))
                .ToList();

            var ids = ordered.Select(o => o.Id).ToList();

            // repository may return null dictionary; coalesce to empty dictionary
            var reads = (await _repo.GetReadsForUserAsync(userId, ids, ct)) ?? new Dictionary<Guid, DomainNotification.NotificationRead>();

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

        // Keep the existing seed signature (unchanged)
        public async Task SeedUnreadAsync(Guid notificationId, IEnumerable<Guid> userIds, string? linkurl, CancellationToken ct = default)
            => await _repo.SeedUnreadForUsersAsync(notificationId, userIds, linkurl, ct);

        public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default)
        {
            var now = DateTime.Now;

            var candidates = (await _repo.GetActiveWindowAsync(2000, now, ct)) ?? new List<DomainNotification.Notification>();

            var userRoles = (await _repo.GetUserRoleIdsAsync(userId, ct)) ?? new HashSet<Guid>();
            var userGroups = (await _repo.GetUserGroupIdsAsync(userId, ct)) ?? new HashSet<int>();

            var filtered = candidates.Where(n =>
                string.Equals(n.TargetType, "All", StringComparison.OrdinalIgnoreCase)
                || (string.Equals(n.TargetType, "User", StringComparison.OrdinalIgnoreCase) && n.TargetUserId.HasValue && n.TargetUserId.Value == userId)
                || (string.Equals(n.TargetType, "Role", StringComparison.OrdinalIgnoreCase) && n.TargetRoleId.HasValue && userRoles.Contains(n.TargetRoleId.Value))
                || (string.Equals(n.TargetType, "Group", StringComparison.OrdinalIgnoreCase) && n.TargetGroupId.HasValue && userGroups.Contains(n.TargetGroupId.Value))
            ).ToList();

            var ids = filtered.Select(n => n.Id).ToList();
            var reads = (await _repo.GetReadsForUserAsync(userId, ids, ct)) ?? new Dictionary<Guid, DomainNotification.NotificationRead>();
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
            if (group == null) throw new ArgumentNullException(nameof(group));

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

        // -------------------------
        // Core helper: persist + seed for recipients
        // -------------------------
        public async Task<DomainNotification.Notification> CreatePersistAndSeedAsync(
            DomainNotification.Notification notification,
            IEnumerable<Guid>? recipientUserIds = null,
            string? linkUrl = null,
            CancellationToken ct = default)
        {
            if (notification == null) throw new ArgumentNullException(nameof(notification));

            // ensure identity/timestamps
            if (notification.Id == Guid.Empty) notification.Id = Guid.NewGuid();
            if (notification.CreatedAt == default) notification.CreatedAt = DateTime.Now;

            // attach metadata if provided
            if (!string.IsNullOrWhiteSpace(linkUrl))
            {
                try
                {
                    notification.Metadata = JsonSerializer.Serialize(new { linkUrl = linkUrl });
                }
                catch
                {
                    // ignore metadata serialization errors
                }
            }

            // persist
            var saved = await _repo.CreateAsync(notification, ct);

            // seed unread for recipients (if any)
            var recipients = recipientUserIds?.ToList() ?? new List<Guid>();
            if (recipients.Any())
            {
                try
                {
                    await _repo.SeedUnreadForUsersAsync(saved.Id, recipients, linkUrl, ct);
                }
                catch (Exception ex)
                {
                    // do not fail if seeding fails; log optionally
                    Console.WriteLine($"SeedUnreadForUsersAsync failed: {ex.Message}");
                }
            }

            // return persisted notification; controller may broadcast using saved.Metadata/linkUrl
            return saved;
        }

        private async Task<int?> ResolveOrEnsureGroupIdAsync(int? requestedId, IEnumerable<Guid>? recipients, Guid createdBy, CancellationToken ct = default)
        {
            if (!requestedId.HasValue) return null;

            // 1) Check if group exists in notification_groups
            try
            {
                var existing = await _repo.GetGroupByIdAsync(requestedId.Value, ct);
                if (existing != null) return requestedId.Value;
            }
            catch
            {
                // ignore and try fallback
            }

            // 2) If notificationOfClassRepo present, try to ensure member group (treat requestedId as classId)
            if (_notificationOfClassRepo != null && recipients != null)
            {
                try
                {
                    var recipientList = recipients.ToList();
                    var groupId = await _notificationOfClassRepo.EnsureMemberGroupAsync(requestedId.Value, recipientList, createdBy, ct);
                    return groupId;
                }
                catch
                {
                    // ignore and fallback to null
                }
            }

            // 3) cannot resolve -> return null (caller should avoid setting TargetGroupId)
            return null;
        }

        public async Task<DomainNotification.Notification> CreateAndSendNotificationToRecipientsAsync(
            string title,
            string body,
            string targetType, // "Group" | "User" | "All" | "Role"
            int? targetGroupId,
            Guid? targetUserId,
            IEnumerable<Guid> recipientUserIds,
            Guid createdBy,
            string? linkUrl = null,
            string? priority = "Normal",
            CancellationToken ct = default)
        {
            if (recipientUserIds == null) recipientUserIds = Enumerable.Empty<Guid>();

            // Build notification object
            var notif = new DomainNotification.Notification
            {
                Title = title,
                Body = body,
                TargetType = targetType,
                TargetGroupId = targetGroupId,
                TargetUserId = targetUserId,
                Priority = "Normal",
                IsActive = true,
                CreatedAt = DateTime.Now,
                CreatedBy = createdBy
            };

            // Resolve/ensure group id to avoid FK constraint error
            int? resolvedGroupId = await ResolveOrEnsureGroupIdAsync(targetGroupId, recipientUserIds, createdBy, ct);
            if (resolvedGroupId.HasValue)
            {
                notif.TargetGroupId = resolvedGroupId.Value;
            }
            else
            {
                // if original targetGroupId was provided but can't be resolved, clear it to avoid FK violation
                notif.TargetGroupId = null;
            }

            // Persist and seed
            var saved = await CreatePersistAndSeedAsync(notif, recipientUserIds, linkUrl, ct);
            return saved;
        }

        // ---------------------------------------------------------------------
        // New/kept maintainer helpers usable across services
        // ---------------------------------------------------------------------

        /// <summary>
        /// Return maintainer user ids for a school by role names (default: "School Admin", "Homeroom Teacher").
        /// This is a convenience method so other services can get maintainer lists in a single call.
        /// </summary>
        public List<Guid> GetMaintainersForSchool(int schoolId, params string[] roleNames)
        {
            var roles = (roleNames == null || roleNames.Length == 0)
                ? new[] { "School Admin", "Homeroom Teacher" }
                : roleNames;

            var result = new List<Guid>();
            foreach (var role in roles)
            {
                try
                {
                    var users = _repo.GetUsersByRoleAndSchool(role, schoolId) ?? new List<AppUser>();
                    foreach (var u in users)
                    {
                        if (u != null && u.Id != Guid.Empty && !result.Contains(u.Id))
                            result.Add(u.Id);
                    }
                }
                catch
                {
                    // ignore per-role failures
                }
            }
            return result;
        }

        public List<StudyHub.Backend.Domain.Entities.AppUser> GetUsersByRoleAndClass(string roleName, int? classId)
        {
            // repository might return null; coalesce to empty list to avoid CS8601
            return _repo.GetUsersByRoleAndClass(roleName, classId) ?? new List<StudyHub.Backend.Domain.Entities.AppUser>();
        }

        // StudyHub.Backend.UseCases.Services/NotificationService (partial)

        public async Task<(int GroupId, List<Guid> MemberIds)> EnsureCompositeGroupAsync(
             int? schoolId = null,
             IEnumerable<string>? roleNames = null,
             int? classId = null,
             int? grade = null,
             IEnumerable<Guid>? explicitUserIds = null,
             string? customName = null,
             Guid createdBy = default,
             CancellationToken ct = default)
        {
            if (_notificationOfClassRepo == null)
                throw new InvalidOperationException("NotificationOfClassRepository is required to ensure composite groups. Register it in DI to use this feature.");

            var recipients = new List<Guid>();

            if (roleNames != null && roleNames.Any())
            {
                foreach (var role in roleNames)
                {
                    try
                    {
                        IEnumerable<dynamic>? users = null;

                        if (classId.HasValue)
                        {
                            users = _repo.GetUsersByRoleAndClass(role, classId);
                        }
                        else if (schoolId.HasValue)
                        {
                            users = _repo.GetUsersByRoleAndSchool(role, schoolId);
                        }

                        if (users != null)
                        {
                            foreach (var u in users)
                            {
                                // support both domain types or dynamic user shapes as long as they expose Id
                                Guid? userId = null;
                                try
                                {
                                    if (u is Guid g) userId = g;
                                    else if (u != null)
                                    {
                                        // try common property names
                                        var prop = u.GetType().GetProperty("Id");
                                        if (prop != null)
                                        {
                                            var val = prop.GetValue(u);
                                            if (val is Guid gg) userId = gg;
                                        }
                                    }
                                }
                                catch
                                {
                                    /* ignore per-user reflection issues */
                                }

                                if (userId.HasValue && userId.Value != Guid.Empty)
                                    recipients.Add(userId.Value);
                            }
                        }
                    }
                    catch
                    {
                        /* ignore per-role failures */
                    }
                }
            }

            if (explicitUserIds != null)
                recipients.AddRange(explicitUserIds.Where(id => id != Guid.Empty));

            var distinctRecipients = recipients.Distinct().ToList();

            var groupId = await _notificationOfClassRepo.EnsureCompositeGroupAsync(
                schoolId: schoolId,
                roleNames: roleNames,
                classId: classId,
                grade: grade,
                userIds: distinctRecipients,
                customName: customName,
                createdBy: createdBy,
                ct: ct
            );

            return (groupId, distinctRecipients);
        }

    }
}