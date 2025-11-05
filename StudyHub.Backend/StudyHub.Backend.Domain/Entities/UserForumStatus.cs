namespace StudyHub.Backend.Domain.Entities
{
    public class UserForumStatus
    {
        public Guid UserId { get; set; }
        public int SchoolId { get; set; }
        public int TotalViolationScore { get; set; }
        public bool IsMute { get; set; }
        public DateTime? MuteUntil { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public AppUser? User { get; set; }
        public School? School { get; set; }
    }
}