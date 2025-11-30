using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class AppUser
{
    public Guid Id { get; set; }

    public string Email { get; set; } = null!;

    public string? PasswordHash { get; set; }

    public string? Username { get; set; }

    public string? Fullname { get; set; }

    public DateOnly? Dob { get; set; }

    public bool? Gender { get; set; }

    public string? Avatar { get; set; }

    public int? SchoolId { get; set; }

    public int? TransferId { get; set; }

    public string? Address { get; set; }

    public int? CommuneId { get; set; }

    public string? PhoneNumber { get; set; }

    public long Wallet { get; set; }

    public bool IsVerified { get; set; }

    public string? RefreshToken { get; set; }

    public DateTime? RefreshTokenExpire { get; set; }

    public string? EmailVerificationToken { get; set; }

    public DateTime? EmailVerificationExpire { get; set; }

    public string? ResetPasswordToken { get; set; }

    public DateTime? ResetPasswordExpire { get; set; }

    public bool IsLoginWithGoogle { get; set; }

    public bool? Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual ICollection<AccountRecoveryRequest> AccountRecoveryRequests { get; set; } = new List<AccountRecoveryRequest>();

    public virtual ICollection<AppUserClass> AppUserClasses { get; set; } = new List<AppUserClass>();

    public virtual ICollection<AppUserLoginHistory> AppUserLoginHistories { get; set; } = new List<AppUserLoginHistory>();

    public virtual Commune? Commune { get; set; }

    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();

    public virtual ICollection<ExamResult> ExamResults { get; set; } = new List<ExamResult>();

    public virtual ICollection<ForumAppeal> ForumAppealUpdatedByNavigations { get; set; } = new List<ForumAppeal>();

    public virtual ICollection<ForumAppeal> ForumAppealUsers { get; set; } = new List<ForumAppeal>();

    public virtual ICollection<ForumAttachment> ForumAttachments { get; set; } = new List<ForumAttachment>();

    public virtual ICollection<ForumComment> ForumComments { get; set; } = new List<ForumComment>();

    public virtual ICollection<ForumFlair> ForumFlairs { get; set; } = new List<ForumFlair>();

    public virtual ICollection<ForumPost> ForumPosts { get; set; } = new List<ForumPost>();

    public virtual ICollection<ForumRule> ForumRules { get; set; } = new List<ForumRule>();

    public virtual ICollection<InteractiveResponse> InteractiveResponses { get; set; } = new List<InteractiveResponse>();

    public virtual ICollection<LessonComment> LessonComments { get; set; } = new List<LessonComment>();

    public virtual ICollection<QAConversation> QAConversationStudents { get; set; } = new List<QAConversation>();

    public virtual ICollection<QAConversation> QAConversationTeachers { get; set; } = new List<QAConversation>();

    public virtual ICollection<QAMessage> QAMessages { get; set; } = new List<QAMessage>();

    public virtual ICollection<RulePattern> RulePatterns { get; set; } = new List<RulePattern>();

    public virtual ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();

    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();

    public virtual ICollection<UserForumStatus> UserForumStatuses { get; set; } = new List<UserForumStatus>();

    public virtual ICollection<ViolationRecord> ViolationRecordReportedByNavigations { get; set; } = new List<ViolationRecord>();

    public virtual ICollection<ViolationRecord> ViolationRecordUsers { get; set; } = new List<ViolationRecord>();

    public virtual ICollection<AppRole> Roles { get; set; } = new List<AppRole>();

    public virtual ICollection<Subject> Subjects { get; set; } = new List<Subject>();
}
