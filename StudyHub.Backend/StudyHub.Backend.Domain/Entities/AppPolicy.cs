using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public class AppPolicy
    {
        public Guid RoleId { get; set; }

        public int ResourceId { get; set; }

        public string ActionType { get; set; } = null!;

        public string? Condition { get; set; }

        public string? Description { get; set; }

        public AppResource Resource { get; set; } = null!;

        public AppRole Role { get; set; } = null!;
    }
}
