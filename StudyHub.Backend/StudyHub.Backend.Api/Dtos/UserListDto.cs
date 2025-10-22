using System;
using System.Collections.Generic;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class UserListDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string? Fullname { get; set; }
        public string? Address { get; set; }
        public string Status { get; set; } = null!; // Active/Inactive
        public string CreatedAt { get; set; } = null!; // yyyy/MM/dd
        public string UpdatedAt { get; set; } = null!; // yyyy/MM/dd
        public string? SchoolName { get; set; }
        public List<string> Roles { get; set; } = new();
        public string? CommuneName { get; set; }
    }
}
