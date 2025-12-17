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
                _repo = repo;
            }

            // Overload ctor to allow maintainer-group / school-aware flows.
            // Register this overload in DI if you want NotificationService to handle maintainer logic.
            public NotificationService(
                INotificationRepository repo,
                INotificationOfClassRepository notificationOfClassRepo,
                IAppUserRepository appUserRepository)
            {
                _repo = repo;
                _notificationOfClassRepo = notificationOfClassRepo;
                _appUserRepository = appUserRepository;
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

            // -------------------------
            // Existing / legacy methods (kept)
            // -------------------------

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

            // Keep the existing seed signature (unchanged)
            public async Task SeedUnreadAsync(Guid notificationId, IEnumerable<Guid> userIds,string? linkurl, CancellationToken ct = default)
                => await _repo.SeedUnreadForUsersAsync(notificationId, userIds, linkurl, ct);

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

            // ---------------------------------------------------------------------
            // Generic wrapper that other services can call to create + send a notification
            // to an arbitrary recipient list (e.g., class members, custom recipients).
            // Resolves target group id first to avoid FK constraint failures.
            // ---------------------------------------------------------------------
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
                // Build notification object
                var notif = new DomainNotification.Notification
                {
                    Title = title,
                    Body = body,
                    TargetType = targetType,
                    TargetGroupId = targetGroupId,
                    TargetUserId = targetUserId,
                    Priority = priority,
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

      
            public async Task<(int GroupId, List<Guid> MaintainerIds, DomainNotification.Notification GroupNotif, DomainNotification.Notification? ActorNotif)?>
                CreateAndSendMaintainerNotificationsForSchoolAsync(
                    int schoolId,
                    Guid actorUserId,
                    bool isCreate,
                    string? linkUrl = null,
                    IEnumerable<string>? maintainerRoleNames = null,
                    CancellationToken ct = default)
            {
                if (_notificationOfClassRepo == null || _appUserRepository == null)
                    throw new InvalidOperationException("NotificationService not configured with notification-class repo or user repo.");

                var actor = _appUserRepository.GetById(actorUserId);
                if (actor == null) return null;

                // Resolve maintainers
                var roles = (maintainerRoleNames == null || !maintainerRoleNames.Any())
                    ? new[] { "School Admin", "Homeroom Teacher" }
                    : maintainerRoleNames.ToArray();

                var maintainers = new List<AppUser>();
                foreach (var role in roles)
                {
                    try
                    {
                        var users = _repo.GetUsersByRoleAndSchool(role, schoolId) ?? new List<AppUser>();
                        maintainers.AddRange(users.Where(u => u != null));
                    }
                    catch
                    {
                        // ignore per-role errors
                    }
                }

                var distinctMaintainers = maintainers.GroupBy(u => u.Id).Select(g => g.First()).ToList();
                var maintainerIds = distinctMaintainers.Select(u => u.Id).ToList();

                // Ensure maintainer group exists
                var groupId = await _notificationOfClassRepo.EnsureMaintainerGroupAsync(schoolId, maintainerIds, actorUserId, ct);

                // Build group notification
                var groupNotif = new DomainNotification.Notification
                {
                    Title = isCreate ? "Lớp mới được tạo" : "Lớp được cập nhật",
                    Body = $"{actor.Fullname ?? "Người dùng"} đã {(isCreate ? "tạo" : "cập nhật")}",
                    TargetType = "Group",
                    TargetGroupId = groupId,
                    Priority = "High",
                    IsActive = true,
                    CreatedAt = DateTime.Now,
                    CreatedBy = actorUserId
                };
                if (!string.IsNullOrWhiteSpace(linkUrl))
                {
                    try { groupNotif.Metadata = JsonSerializer.Serialize(new { linkUrl = linkUrl }); } catch { }
                }


                // Persist group notification and seed unread
                DomainNotification.Notification savedGroup = await CreatePersistAndSeedAsync(groupNotif, maintainerIds, linkUrl, ct);

                // Actor notification if actor is not in maintainer list
                DomainNotification.Notification? savedActor = null;
                var actorInGroup = maintainerIds.Contains(actorUserId);
                if (!actorInGroup)
                {
                    var actorNotif = new DomainNotification.Notification
                    {
                        Title = isCreate ? "Tạo lớp thành công" : "Cập nhật lớp thành công",
                        Body = $"Tạo/Cập nhật: {groupNotif.Title}",
                        TargetType = "User",
                        TargetUserId = actorUserId,
                        Priority = "Normal",
                        IsActive = true,
                        CreatedAt = DateTime.Now,
                        CreatedBy = actorUserId
                    };
                    if (!string.IsNullOrWhiteSpace(linkUrl))
                    {
                        try { actorNotif.Metadata = JsonSerializer.Serialize(new { linkUrl = linkUrl }); } catch { }
                    }

                    savedActor = await CreatePersistAndSeedAsync(actorNotif, new[] { actorUserId }, linkUrl, ct);
                }

                return (groupId, maintainerIds, savedGroup, savedActor);
            }

            // For compatibility: provide the old name too (alias) if some callers used a different method name.
            // This avoids the "method not found" compile error.
            public Task<(int GroupId, List<Guid> MaintainerIds, DomainNotification.Notification GroupNotif, DomainNotification.Notification? ActorNotif)?>
                CreateAndSendMaintainerNotificationsForClassAsync(
                    int classId,
                    Guid actorUserId,
                    bool isCreate,
                    string? linkUrl = null,
                    IEnumerable<string>? maintainerRoleNames = null,
                    CancellationToken ct = default)
            {
                // treat classId as schoolId if that's how callers used it previously
                // but safer: try to get actor's school and use that; fall back to classId as schoolId
                int schoolId = classId;
                try
                {
                    var actor = _appUserRepository?.GetById(actorUserId);
                    if (actor != null && actor.SchoolId.HasValue)
                        schoolId = actor.SchoolId.Value;
                }
                catch
                {
                    // ignore and use classId as schoolId
                }

                return CreateAndSendMaintainerNotificationsForSchoolAsync(schoolId, actorUserId, isCreate, linkUrl, maintainerRoleNames, ct);
            }
        }
    }