using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public class NotificationFile
    {
        public int Id { get; set; }

        public string FileName { get; set; } = null!;

        public string FileUrl { get; set; } = null!;

        public virtual ICollection<ClassNotificationFileMapping> ClassNotificationFileMappings { get; set; } = new List<ClassNotificationFileMapping>();
    }
}
