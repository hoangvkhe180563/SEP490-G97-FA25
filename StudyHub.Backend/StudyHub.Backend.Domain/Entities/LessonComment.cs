using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public class LessonComment
    {
        public int Id { get; set; }

        public int LessonId { get; set; }

        public Guid AppUserId { get; set; }

        public string Content { get; set; } = null!;

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }

        public AppUser AppUser { get; set; } = null!;

        public Lesson Lesson { get; set; } = null!;
    }
}
