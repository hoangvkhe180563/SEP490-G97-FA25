using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Repositories.Notifications
{
    public interface INotificationOfClassRepository
    {
        /// <summary>
        /// Đảm bảo group maintainer cho trường (SchoolAdmin + Homeroom Teacher), đồng bộ thành viên.
        /// </summary>
        Task<int> EnsureMaintainerGroupAsync(int schoolId, IEnumerable<Guid> userIds, Guid createdBy, CancellationToken ct = default);

        /// <summary>
        /// Đảm bảo group members cho lớp, đồng bộ thành viên lớp.
        /// </summary>
        Task<int> EnsureMemberGroupAsync(int classId, IEnumerable<Guid> userIds, Guid createdBy, CancellationToken ct = default);
        Task<int> EnsureCompositeGroupAsync(
            int? schoolId,
            IEnumerable<string>? roleNames,
            int? classId,
            int? grade,
            IEnumerable<Guid>? userIds,
            string? customName,
            Guid createdBy,
            CancellationToken ct = default);
    }
}
