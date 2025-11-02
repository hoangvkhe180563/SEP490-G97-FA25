using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public class QATopic
    {
        public short Id { get; set; }

        public short SubjectId { get; set; }

        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        public bool? IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public List<QAConversation> QAConversations { get; set; } = new List<QAConversation>();

        public Subject Subject { get; set; } = null!;
    }
}
