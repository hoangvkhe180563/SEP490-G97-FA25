namespace StudyHub.Backend.Domain.Entities
{
    public abstract class IAuditTrail
    {
        public DateTime CreatedAt { get; set; }

        public Guid CreatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public Guid? UpdatedBy { get; set; }

        public DateTime? DeletedAt { get; set; }
    }
}