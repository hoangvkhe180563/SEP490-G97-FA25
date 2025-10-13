using System;

namespace StudyHub.Backend.Domain.Entities
{
    public class Manager
    {
        public int Id { get; set; }
        public Guid AppUserId { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
        public AppUser? AppUser { get; set; }
    }
}
