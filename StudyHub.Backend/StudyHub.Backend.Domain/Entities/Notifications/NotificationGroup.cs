using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities.Notifications
{
    public class NotificationGroup
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        public Guid? CreatedBy { get; set; }

        public DateTime CreatedAt { get; set; }

        public virtual AppUser? CreatedByNavigation { get; set; }

        public virtual ICollection<NotificationGroupMember> NotificationGroupMembers { get; set; } = new List<NotificationGroupMember>();

        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}
