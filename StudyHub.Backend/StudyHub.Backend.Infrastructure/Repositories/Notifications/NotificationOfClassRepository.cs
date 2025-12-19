using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Repositories.Notifications;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
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

        
        public async Task<int> EnsureCompositeGroupAsync(
            int? schoolId,
            IEnumerable<string>? roleNames,
            int? classId,
            int? grade,
            IEnumerable<Guid>? userIds,
            string? customName,
            Guid createdBy,
            CancellationToken ct = default)
        {
            // Build normalized name parts (skip empty pieces). If customName provided, use it as base.
            string baseName;
            if (!string.IsNullOrWhiteSpace(customName))
            {
                baseName = customName.Trim();
            }
            else
            {
                var parts = new List<string>();
                if (schoolId.HasValue) parts.Add($"school-{schoolId.Value}");
                if (roleNames != null && roleNames.Any())
                {
                    // sanitize role names: replace spaces with underscore, remove special chars optionally
                    var r = string.Join("+", roleNames.Select(x => (x ?? "").Trim().Replace(' ', '_')));
                    parts.Add($"roles-{r}");
                }
                if (classId.HasValue) parts.Add($"class-{classId.Value}");
                if (grade.HasValue) parts.Add($"grade-{grade.Value}");
                if (!parts.Any()) parts.Add("misc-group");
                baseName = string.Join("-", parts);
            }

            var normalizedName = baseName.Trim().ToLowerInvariant();
            var description = $"Auto-generated group: {baseName}";

            // Reuse existing private EnsureGroupAsync which already ensures idempotency by name.
            return await EnsureGroupAsync(normalizedName, description, userIds ?? Array.Empty<Guid>(), createdBy, ct);
        }

        private async Task<int> EnsureGroupAsync(
            string name,
            string description,
            IEnumerable<Guid> userIds,
            Guid createdBy,
            CancellationToken ct)
        {
            var normalizedName = name.Trim().ToLowerInvariant();

            using var tx = await _context.Database.BeginTransactionAsync(ct);

            // 1️⃣ Tìm group theo name (normalized)
            var group = await _context.NotificationGroups
                .FirstOrDefaultAsync(g => g.Name.ToLower() == normalizedName, ct);

            // 2️⃣ Nếu chưa có thì tạo
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

            // 3️⃣ Add members (KHÔNG auto remove)
            var distinctUserIds = userIds?.Distinct().ToList() ?? new List<Guid>();
            if (distinctUserIds.Any())
            {
                var existingIds = await _context.NotificationGroupMembers
                    .Where(m => m.GroupId == groupId)
                    .Select(m => m.UserId)
                    .ToListAsync(ct);

                var toAdd = distinctUserIds
                    .Where(id => !existingIds.Contains(id))
                    .Select(id => new Data.NotificationGroupMember
                    {
                        GroupId = groupId,
                        UserId = id,
                        AddedAt = DateTime.UtcNow
                    })
                    .ToList();

                if (toAdd.Any())
                {
                    await _context.NotificationGroupMembers.AddRangeAsync(toAdd, ct);
                    await _context.SaveChangesAsync(ct);
                }
            }

            await tx.CommitAsync(ct);
            return groupId;
        }

    }
}