using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public class ClassNotificationComment
    {
        public int Id { get; set; }

        public int NotificationId { get; set; }

        public Guid CreatedBy { get; set; }

        public string Content { get; set; } = null!;
        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }
    }
}
