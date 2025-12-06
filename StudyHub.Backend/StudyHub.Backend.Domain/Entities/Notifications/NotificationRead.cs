using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities.Notifications
{
    public class NotificationRead
    {
        public Guid NotificationId { get; set; }

        public Guid UserId { get; set; }

        public bool IsRead { get; set; }

        public DateTime? ReadAt { get; set; }

        public DateTime DeliveredAt { get; set; }

        public virtual Notification Notification { get; set; } = null!;

        public virtual AppUser User { get; set; } = null!;
    }
}
