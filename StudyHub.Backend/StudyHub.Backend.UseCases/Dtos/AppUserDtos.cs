using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class AppUserListDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string? Username { get; set; }
        public string? Fullname { get; set; }
        public string? Avatar { get; set; }
        public string? SchoolName { get; set; }
        public string Status { get; set; } = null!; // Active/Inactive
        public string CreatedAt { get; set; } = null!; // yyyy/MM/dd
        public List<string> Roles { get; set; } = new();
        // Subjects assigned to the user (for teacher role)
        public List<SubjectDto> Subjects { get; set; } = new();
    }
    public class SubjectDto
    {
        public short Id { get; set; }
        public string Name { get; set; } = null!;
    }
    public class UserInfoDtos
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string Username { get; set; } = null!;
        public List<string> Roles { get; set; } = new();
        public List<string> Permissions { get; set; } = new();
        public List<int> ClassIds { get; set; } = new();
        public List<short> SubjectIds { get; set; } = new();
        public int? SchoolId { get; set; }
    }
}
