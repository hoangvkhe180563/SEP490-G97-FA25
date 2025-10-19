using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public class ClassNotificationFileMapping
    {
        public int Id { get; set; }

        public int NotificationId { get; set; }

        public int FileId { get; set; }

        public virtual NotificationFile File { get; set; } = null!;

        public virtual ClassNotification Notification { get; set; } = null!;
    }
}
