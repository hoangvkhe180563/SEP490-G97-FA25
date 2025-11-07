using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public  class ClassNotificationFile
    {
        public int Id { get; set; }

        public int NotificationId { get; set; }

        public string FileName { get; set; } = null!;

        public string FileUrl { get; set; } = null!;

        public string? ThumbnailUrl { get; set; }

        public string? FileType { get; set; }

        public virtual ClassNotification Notification { get; set; } = null!;
    }
}
