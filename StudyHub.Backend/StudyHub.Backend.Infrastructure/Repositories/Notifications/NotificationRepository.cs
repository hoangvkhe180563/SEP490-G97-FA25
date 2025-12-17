using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories.Notifications;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using DomainNotification = StudyHub.Backend.Domain.Entities.Notifications;

namespace StudyHub.Backend.Infrastructure.Repositories.Notifications
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly AppDbContext _context;

        public NotificationRepository(AppDbContext context)
        {
            _context = context;
        }

        #region Mappers
        private DomainNotification.Notification MapNotificationDataToDomain(Data.Notification d)
        {
            if (d == null) return null!;
            return new DomainNotification.Notification
            {
                Id = d.Id,
                Title = d.Title,
                Body = d.Body,
                TargetType = d.TargetType,
                TargetRoleId = d.TargetRoleId,
                TargetGroupId = d.TargetGroupId,
                TargetUserId = d.TargetUserId,
                Priority = d.Priority,
                IsActive = d.IsActive,
                ExpiresAt = d.ExpiresAt,
                CreatedAt = d.CreatedAt,
                CreatedBy = d.CreatedBy,
                Metadata = d.Metadata
            };
        }

        private Data.Notification MapNotificationDomainToData(DomainNotification.Notification n)
        {
            if (n == null) return null!;
            return new Data.Notification
            {
                Id = n.Id == Guid.Empty ? Guid.NewGuid() : n.Id,
                Title = n.Title,
                Body = n.Body,
                TargetType = n.TargetType,
                TargetRoleId = n.TargetRoleId,
                TargetGroupId = n.TargetGroupId,
                TargetUserId = n.TargetUserId,
                Priority = n.Priority,
                IsActive = n.IsActive,
                ExpiresAt = n.ExpiresAt,
                CreatedAt = n.CreatedAt == default ? DateTime.Now : n.CreatedAt,
                CreatedBy = n.CreatedBy,
                Metadata = n.Metadata
            };
        }

        private DomainNotification.NotificationRead MapReadDataToDomain(NotificationRead r)
        {
            if (r == null) return null!;
            return new DomainNotification.NotificationRead
            {
                NotificationId = r.NotificationId,
                UserId = r.UserId,
                IsRead = r.IsRead,
                ReadAt = r.ReadAt,
                LinkUrl = r.LinkUrl,
                DeliveredAt = r.DeliveredAt
            };
        }

        private DomainNotification.NotificationGroup MapGroupDataToDomain(NotificationGroup g)
        {
            if (g == null) return null!;
            return new DomainNotification.NotificationGroup
            {
                Id = g.Id,
                Name = g.Name,
                Description = g.Description,
                CreatedBy = g.CreatedBy,
                CreatedAt = g.CreatedAt
            };
        }

        private NotificationGroup MapGroupDomainToData(DomainNotification.NotificationGroup g)
        {
            if (g == null) return null!;
            return new NotificationGroup
            {
                Id = g.Id,
                Name = g.Name,
                Description = g.Description,
                CreatedBy = g.CreatedBy,
                CreatedAt = g.CreatedAt == default ? DateTime.Now : g.CreatedAt
            };
        }
        #endregion

        #region Notifications CRUD (domain <-> data)
        public async Task<DomainNotification.Notification> CreateAsync(DomainNotification.Notification notification, CancellationToken ct = default)
        {
            try
            {
                var data = MapNotificationDomainToData(notification);
                await _context.Notifications.AddAsync(data, ct);
                await _context.SaveChangesAsync(ct);
                return MapNotificationDataToDomain(data);
            }
            catch (Exception ex)
            {
                new InfrastructureException("NotificationRepository", "CreateAsync failed: " + ex.Message).LogError();
                throw;
            }
        }

        public async Task<DomainNotification.Notification?> UpdateAsync(DomainNotification.Notification notification, CancellationToken ct = default)
        {
            try
            {
                var exist = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == notification.Id, ct);
                if (exist == null) return null;

                exist.Title = notification.Title;
                exist.Body = notification.Body;
                exist.TargetType = notification.TargetType;
                exist.TargetRoleId = notification.TargetRoleId;
                exist.TargetGroupId = notification.TargetGroupId;
                exist.TargetUserId = notification.TargetUserId;
                exist.Priority = notification.Priority;
                exist.IsActive = notification.IsActive;
                exist.ExpiresAt = notification.ExpiresAt;
                exist.Metadata = notification.Metadata;

                _context.Notifications.Update(exist);
                await _context.SaveChangesAsync(ct);

                return MapNotificationDataToDomain(exist);
            }
            catch (Exception ex)
            {
                new InfrastructureException("NotificationRepository", "UpdateAsync failed: " + ex.Message).LogError();
                throw;
            }
        }
       
        public async Task<DomainNotification.Notification?> GetByIdAsync(Guid id, CancellationToken ct = default)
        {
            var d = await _context.Notifications
                .AsNoTracking()
                .FirstOrDefaultAsync(n => n.Id == id, ct);

            return d == null ? null : MapNotificationDataToDomain(d);
        }

        public async Task<List<DomainNotification.Notification>> GetActiveWindowAsync(int take, DateTime now, CancellationToken ct = default)
        {
            var safeTake = Math.Clamp(take, 1, 5000);
            var list = await _context.Notifications
                .AsNoTracking()
                .Where(n => (n.IsActive ?? true) && (n.ExpiresAt == null || n.ExpiresAt > now))
                .OrderByDescending(n => n.CreatedAt)
                .Take(safeTake)
                .ToListAsync(ct);

            return list.Select(MapNotificationDataToDomain).ToList();
        }

        public async Task<List<DomainNotification.Notification>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken ct = default)
        {
            var idList = ids.ToList();
            if (!idList.Any()) return new List<DomainNotification.Notification>();

            var list = await _context.Notifications
                .AsNoTracking()
                .Where(n => idList.Contains(n.Id))
                .ToListAsync(ct);

            return list.Select(MapNotificationDataToDomain).ToList();
        }

        public async Task DeactivateAsync(Guid notificationId, CancellationToken ct = default)
        {
            var exist = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == notificationId, ct);
            if (exist == null) return;
            exist.IsActive = false;
            _context.Notifications.Update(exist);
            await _context.SaveChangesAsync(ct);
        }
        #endregion

        #region Reads
        public async Task<Dictionary<Guid, DomainNotification.NotificationRead>> GetReadsForUserAsync(Guid userId, IEnumerable<Guid> notificationIds, CancellationToken ct = default)
        {
            var ids = notificationIds.ToList();
            if (!ids.Any()) return new Dictionary<Guid, DomainNotification.NotificationRead>();

            var reads = await _context.NotificationReads
                .AsNoTracking()
                .Where(r => r.UserId == userId && ids.Contains(r.NotificationId))
                .ToListAsync(ct);

            return reads.ToDictionary(r => r.NotificationId, r => MapReadDataToDomain(r));
        }

        public async Task UpsertReadAsync(Guid notificationId, Guid userId, DateTime readAt, CancellationToken ct = default)
        {
            await UpsertReadsInternalAsync(new[] { notificationId }, userId, readAt, ct);
        }

        public async Task UpsertReadsAsync(IEnumerable<Guid> notificationIds, Guid userId, DateTime readAt, CancellationToken ct = default)
        {
            await UpsertReadsInternalAsync(notificationIds, userId, readAt, ct);
        }

        private async Task UpsertReadsInternalAsync(IEnumerable<Guid> notificationIds, Guid userId, DateTime readAt, CancellationToken ct)
        {
            try
            {
                var ids = notificationIds.Distinct().ToList();
                if (!ids.Any()) return;

                var existing = await _context.NotificationReads
                    .Where(r => r.UserId == userId && ids.Contains(r.NotificationId))
                    .ToListAsync(ct);

                var existingIds = existing.Select(r => r.NotificationId).ToHashSet();

                foreach (var r in existing)
                {
                    r.IsRead = true;
                    r.ReadAt = readAt;
                    _context.NotificationReads.Update(r);
                }

                var toAdd = ids.Where(id => !existingIds.Contains(id))
                    .Select(id => new NotificationRead
                    {
                        NotificationId = id,
                        UserId = userId,
                        IsRead = true,
                        ReadAt = readAt,
                        DeliveredAt = DateTime.Now
                    }).ToList();

                if (toAdd.Any())
                    await _context.NotificationReads.AddRangeAsync(toAdd, ct);

                await _context.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                new InfrastructureException("NotificationRepository", "UpsertReadsAsync failed: " + ex.Message).LogError();
                throw;
            }
        }
        #endregion

        #region Groups
        public async Task<DomainNotification.NotificationGroup> CreateGroupAsync(DomainNotification.NotificationGroup group, CancellationToken ct = default)
        {
            try
            {
                var data = MapGroupDomainToData(group);
                await _context.NotificationGroups.AddAsync(data, ct);
                await _context.SaveChangesAsync(ct);
                return MapGroupDataToDomain(data);
            }
            catch (Exception ex)
            {
                new InfrastructureException("NotificationRepository", "CreateGroupAsync failed: " + ex.Message).LogError();
                throw;
            }
        }

        public async Task<DomainNotification.NotificationGroup?> GetGroupByIdAsync(int id, CancellationToken ct = default)
        {
            var g = await _context.NotificationGroups
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id, ct);

            return g == null ? null : MapGroupDataToDomain(g);
        }

        public async Task<List<DomainNotification.NotificationGroup>> GetGroupsForUserAsync(Guid userId, CancellationToken ct = default)
        {
            var groupIds = await _context.NotificationGroupMembers
                .AsNoTracking()
                .Where(m => m.UserId == userId)
                .Select(m => m.GroupId)
                .ToListAsync(ct);

            if (!groupIds.Any()) return new List<DomainNotification.NotificationGroup>();

            var list = await _context.NotificationGroups
                .AsNoTracking()
                .Where(g => groupIds.Contains(g.Id))
                .ToListAsync(ct);

            return list.Select(MapGroupDataToDomain).ToList();
        }

        public async Task AddUserToGroupAsync(int groupId, Guid userId, CancellationToken ct = default)
        {
            var exists = await _context.NotificationGroupMembers.FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == userId, ct);
            if (exists != null) return;

            var gm = new NotificationGroupMember
            {
                GroupId = groupId,
                UserId = userId,
                AddedAt = DateTime.Now
            };
            await _context.NotificationGroupMembers.AddAsync(gm, ct);
            await _context.SaveChangesAsync(ct);
        }
      
        public async Task RemoveUserFromGroupAsync(int groupId, Guid userId, CancellationToken ct = default)
        {
            var exists = await _context.NotificationGroupMembers.FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == userId, ct);
            if (exists == null) return;

            _context.NotificationGroupMembers.Remove(exists);
            await _context.SaveChangesAsync(ct);
        }
        #endregion

        #region Helpers (roles / groups ids)
        public async Task<HashSet<Guid>> GetUserRoleIdsAsync(Guid userId, CancellationToken ct = default)
        {
            var user = await _context.AppUsers
                .AsNoTracking()
                .Include(u => u.Roles)
                .FirstOrDefaultAsync(u => u.Id == userId, ct);

            if (user == null) return new HashSet<Guid>();
            var roleIds = user.Roles?.Select(r => r.Id).ToList() ?? new List<Guid>();
            return roleIds.ToHashSet();
        }

        public async Task<HashSet<int>> GetUserGroupIdsAsync(Guid userId, CancellationToken ct = default)
        {
            var groupIds = await _context.NotificationGroupMembers
                .AsNoTracking()
                .Where(gm => gm.UserId == userId)
                .Select(gm => gm.GroupId)
                .ToListAsync(ct);

            return groupIds.ToHashSet();
        }
        public async Task SeedUnreadForUsersAsync(Guid notificationId, IEnumerable<Guid> userIds,string? linkurl, CancellationToken ct = default)
        {
            var ids = userIds?.Distinct().ToList() ?? new List<Guid>();
            if (!ids.Any()) return;

            // Lấy các bản ghi đã tồn tại để tránh trùng
            var existing = await _context.NotificationReads
                .Where(r => r.NotificationId == notificationId && ids.Contains(r.UserId))
                .Select(r => r.UserId)
                .ToListAsync(ct);

            var now = DateTime.Now;
            var toAdd = ids
                .Where(id => !existing.Contains(id))
                .Select(id => new NotificationRead
                {
                    NotificationId = notificationId,
                    UserId = id,
                    LinkUrl=linkurl,
                    IsRead = false,
                    DeliveredAt = now
                })
                .ToList();

            if (toAdd.Any())
            {
                await _context.NotificationReads.AddRangeAsync(toAdd, ct);
                await _context.SaveChangesAsync(ct);
            }
        }
        public List<Domain.Entities.AppUser> GetUsersByRoleAndSchool(string roleName, int? schoolId)
        {
            if (!schoolId.HasValue) return new List<Domain.Entities.AppUser>();

            var norm = roleName?.Trim().ToLower() ?? "";

            var users = _context.AppUsers
                .Include(u => u.Roles)
                .Where(u => u.SchoolId == schoolId &&
                            u.Roles.Any(r => r.Name.ToLower() == norm))
                .AsNoTracking()
                .ToList();

            return users.Select(MapUserDataToDomain).ToList();
        }

        private Domain.Entities.AppUser MapUserDataToDomain(Data.AppUser d)
        {
            if (d == null) return null!;
            return new Domain.Entities.AppUser
            {
                Id = d.Id,
                Username = d.Username,
                Email = d.Email,
                Fullname = d.Fullname,
                PhoneNumber = d.PhoneNumber,
                SchoolId = d.SchoolId,
                CommuneId = d.CommuneId,
                IsVerified = d.IsVerified,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt,
                // Map roles nếu cần
                Roles = d.Roles?.Select(r => new Domain.Entities.AppRole
                {
                    Id = r.Id,
                    Name = r.Name,
                    // các field khác
                }).ToList()
            };
        }
        #endregion
    }
}