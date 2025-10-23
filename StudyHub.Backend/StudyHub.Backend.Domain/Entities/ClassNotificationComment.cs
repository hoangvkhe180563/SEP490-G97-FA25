using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public class ClassNotificationComment:IAuditTrail
    {
        public int Id { get; set; }

        public int NotificationId { get; set; }

        public Guid AppUserId { get; set; }

        public string Content { get; set; } = null!;

       

        public virtual AppUser AppUser { get; set; } = null!;

        public virtual ClassNotification Notification { get; set; } = null!;
    }
}
