using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public class QAConversation
    {
        public Guid Id { get; set; }

        public string Title { get; set; } = null!;

        public Guid StudentId { get; set; }

        public Guid? TeacherId { get; set; }

        public string Type { get; set; } = null!;

        public bool IsPaid { get; set; }

        public short TopicId { get; set; }

        public DateTime CreatedAt { get; set; }

        public List<QAMessage> QAMessages { get; set; } = new List<QAMessage>();

        public AppUser Student { get; set; } = null!;

        public AppUser? Teacher { get; set; }

        public QATopic Topic { get; set; } = null!;
    }
}
