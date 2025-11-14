using System;

namespace StudyHub.Backend.Api.Dtos
{
    public class LoginHistoryDto
    {
        public long Id { get; set; }
        public Guid SessionId { get; set; }
        public DateTime LoginAt { get; set; }
        public DateTime? LogoutAt { get; set; }
        public bool? IsSuccess { get; set; }
        public bool? IsActiveSession { get; set; }
        public DateTime? LastSeen { get; set; }
    }
}
