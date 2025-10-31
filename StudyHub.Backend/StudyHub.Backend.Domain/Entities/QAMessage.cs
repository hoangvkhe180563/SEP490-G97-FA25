using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public class QAMessage
    {
        public Guid Id { get; set; }

        public Guid ConversationId { get; set; }

        public Guid SenderId { get; set; }

        public string Content { get; set; } = null!;

        public bool IsFromAi { get; set; }

        public bool IsPaid { get; set; }

        public DateTime CreatedAt { get; set; }

        public QAConversation Conversation { get; set; } = null!;

        public AppUser Sender { get; set; } = null!;
    }
}
