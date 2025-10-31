using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public class ClassNotificationReadStatus
    {
        public int NotificationId { get; set; }

        public Guid AppUserId { get; set; }

        public bool IsRead { get; set; }

        public DateTime ReadAt { get; set; }

        public AppUser AppUser { get; set; } = null!;

        public ClassNotification Notification { get; set; } = null!;
    }
}
