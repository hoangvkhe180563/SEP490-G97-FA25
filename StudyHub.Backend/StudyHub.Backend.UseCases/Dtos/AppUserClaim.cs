using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class AppUserClaim
    {
        public Guid UserId { get; set; }

        public short SubjectId { get; set; }

        public int ClassId { get; set; }

        // Optional related objects for convenience (may be null)
        public StudyHub.Backend.Domain.Entities.Class? Class { get; set; }

        public StudyHub.Backend.Domain.Entities.Subject? Subject { get; set; }

        public StudyHub.Backend.Domain.Entities.AppUser? User { get; set; }
    }
}
