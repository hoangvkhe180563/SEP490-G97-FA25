using System;

namespace StudyHub.Backend.Domain.Entities
{
    public class Teacher
    {
        public int Id { get; set; }
        public Guid AppUserId { get; set; }
        public string? PhoneNumber { get; set; }
        public AppUser? AppUser { get; set; }
    }
}
