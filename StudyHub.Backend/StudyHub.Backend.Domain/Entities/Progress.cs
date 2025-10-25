using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public class Progress
    {
        public int Id { get; set; }

        public int EnrollmentId { get; set; }

        public int LessonId { get; set; }

        public DateTime CompletionDate { get; set; }

        public Enrollment Enrollment { get; set; } = null!;

        public Lesson Lesson { get; set; } = null!;
    }
}
