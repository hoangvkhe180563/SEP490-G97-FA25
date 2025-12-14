using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities.Notifications
{
    public class NotificationGroupMember
    {
        public int GroupId { get; set; }

        public Guid UserId { get; set; }

        public DateTime AddedAt { get; set; }

        public virtual NotificationGroup Group { get; set; } = null!;

        public virtual AppUser User { get; set; } = null!;
    }
}
