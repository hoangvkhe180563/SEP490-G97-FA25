using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public class QAConversationRead
    {
        public Guid ConversationId { get; set; }

        public Guid UserId { get; set; }

        public DateTime LastReadAt { get; set; }

        public QAConversation Conversation { get; set; } = null!;
    }
}
