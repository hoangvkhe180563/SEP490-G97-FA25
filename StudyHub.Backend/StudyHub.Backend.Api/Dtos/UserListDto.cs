using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Api.Dtos
{
    public class AppUserListDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string? Fullname { get; set; }
        public string Status { get; set; } = null!; // Active/Inactive
        public string CreatedAt { get; set; } = null!; // yyyy/MM/dd
        public List<string> Roles { get; set; } = new();
    }
}
