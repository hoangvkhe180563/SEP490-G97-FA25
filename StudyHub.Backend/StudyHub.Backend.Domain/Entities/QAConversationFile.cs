using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public class QAConversationFile
    {
        public Guid Id { get; set; }

        public Guid ConversationId { get; set; }

        public Guid? CreatedBy { get; set; }

        public string FileUrl { get; set; } = null!;

        public string FileName { get; set; } = null!;

        public string? FileType { get; set; }

        public DateTime CreatedAt { get; set; }

        public QAConversation Conversation { get; set; } = null!;

        public AppUser? Creator { get; set; }
    }
}
