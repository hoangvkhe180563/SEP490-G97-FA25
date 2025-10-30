using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public class AppUserSubjectClass
    {
        public Guid UserId { get; set; }

        public short SubjectId { get; set; }

        public int ClassId { get; set; }

        public Class Class { get; set; } = null!;

        public Subject Subject { get; set; } = null!;

        public AppUser User { get; set; } = null!;
    }
}
