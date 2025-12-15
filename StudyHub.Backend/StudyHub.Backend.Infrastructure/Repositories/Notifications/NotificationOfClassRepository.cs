using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Repositories.Notifications;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Infrastructure.Repositories.Notifications
{
    public class NotificationOfClassRepository : INotificationOfClassRepository
    {
        private readonly AppDbContext _context;

        public NotificationOfClassRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<int> EnsureMaintainerGroupAsync(int schoolId, IEnumerable<Guid> userIds, Guid createdBy, CancellationToken ct = default)
        {
            var name = $"school-{schoolId}-class-maintainers";
            var desc = "School admins + homeroom teachers của trường";

            return await EnsureGroupAsync(name, desc, userIds, createdBy, ct);
        }

        public async Task<int> EnsureMemberGroupAsync(int classId, IEnumerable<Guid> userIds, Guid createdBy, CancellationToken ct = default)
        {
            var name = $"class-{classId}-members";
            var desc = $"Thành viên lớp {classId}";

            return await EnsureGroupAsync(name, desc, userIds, createdBy, ct);
        }

        private async Task<int> EnsureGroupAsync(string name, string description, IEnumerable<Guid> userIds, Guid createdBy, CancellationToken ct)
        {
            var normalizedName = name.Trim();
            var group = await _context.NotificationGroups
                .FirstOrDefaultAsync(g => g.Name == normalizedName, ct);

            if (group == null)
            {
                group = new Data.NotificationGroup
                {
                    Name = normalizedName,
                    Description = description,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = createdBy
                };
                _context.NotificationGroups.Add(group);
                await _context.SaveChangesAsync(ct);
            }

            var groupId = group.Id;

            // Đồng bộ thành viên
            var distinctUserIds = userIds?.Distinct().ToList() ?? new List<Guid>();

            var existingMembers = await _context.NotificationGroupMembers
                .Where(m => m.GroupId == groupId)
                .ToListAsync(ct);

            var existingIds = existingMembers.Select(m => m.UserId).ToHashSet();

            var toAdd = distinctUserIds.Where(id => !existingIds.Contains(id)).ToList();
            var toRemove = existingMembers.Where(m => !distinctUserIds.Contains(m.UserId)).ToList();

            if (toAdd.Any())
            {
                var now = DateTime.UtcNow;
                var newMembers = toAdd.Select(id => new Data.NotificationGroupMember
                {
                    GroupId = groupId,
                    UserId = id,
                    AddedAt = now
                });
                await _context.NotificationGroupMembers.AddRangeAsync(newMembers, ct);
            }

            if (toRemove.Any())
            {
                _context.NotificationGroupMembers.RemoveRange(toRemove);
            }

            if (toAdd.Any() || toRemove.Any())
            {
                await _context.SaveChangesAsync(ct);
            }

            return groupId;
        }
    }
}
