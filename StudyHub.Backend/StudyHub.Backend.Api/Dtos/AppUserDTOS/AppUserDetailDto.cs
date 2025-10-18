using System;
using System.Collections.Generic;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.Api.Dtos.AppUserDTOS
{
    public class AppUserDetailDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string Username { get; set; } = null!;
    public string? Fullname { get; set; }
    // Gender friendly string: "Male" or "Female"
    public string? Gender { get; set; }
    public string? Avatar { get; set; }
        public string? Address { get; set; }
        public string Status { get; set; } = null!; // Active/Inactive
        public string CreatedAt { get; set; } = null!;
        public string? UpdatedAt { get; set; }
        public string? SchoolName { get; set; }
        public string? CityName { get; set; }
        public string? ProvinceName { get; set; }
        public List<string> Roles { get; set; } = new();
        public string? CommuneName { get; set; }
    }
}
