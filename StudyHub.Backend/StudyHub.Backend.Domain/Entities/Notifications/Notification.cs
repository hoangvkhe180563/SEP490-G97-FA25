using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities.Notifications
{
    public class Notification
    {
        public Guid Id { get; set; }

        public string Title { get; set; } = null!;

        public string? Body { get; set; }

        public string? LinkUrl { get; set; }

        public string TargetType { get; set; } = null!;

        public Guid? TargetRoleId { get; set; }

        public int? TargetGroupId { get; set; }

        public Guid? TargetUserId { get; set; }

        public string Priority { get; set; } = null!;

        public bool? IsActive { get; set; }

        public DateTime? ExpiresAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public Guid CreatedBy { get; set; }

        public string? Metadata { get; set; }

        public virtual AppUser CreatedByNavigation { get; set; } = null!;

        public virtual ICollection<NotificationRead> NotificationReads { get; set; } = new List<NotificationRead>();

        public virtual NotificationGroup? TargetGroup { get; set; }

        public virtual AppRole? TargetRole { get; set; }

        public virtual AppUser? TargetUser { get; set; }
    }
}
