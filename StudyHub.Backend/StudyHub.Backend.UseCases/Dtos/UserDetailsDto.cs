using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class UserDetailsDto
    {
        public Guid Id { get; set; }
        public required string Email { get; set; }
        public required string Username { get; set; }
        public string? Fullname { get; set; }
        public string? Address { get; set; }
        public required string Status { get; set; }
        public required string CreatedAt { get; set; }
        public required string UpdatedAt { get; set; }
        public string? SchoolName { get; set; }
        public required List<string> Roles { get; set; }
        public string? CommuneName { get; set; }
        public string? ImageUrl { get; set; }
    }
}
