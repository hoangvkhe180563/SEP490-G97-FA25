using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AppPolicy> AppPolicies { get; set; }

    public virtual DbSet<AppResource> AppResources { get; set; }

    public virtual DbSet<AppRole> AppRoles { get; set; }

    public virtual DbSet<AppUser> AppUsers { get; set; }

    public virtual DbSet<AppUserSubjectClass> AppUserSubjectClasses { get; set; }

    public virtual DbSet<Chapter> Chapters { get; set; }

    public virtual DbSet<City> Cities { get; set; }

    public virtual DbSet<Class> Classes { get; set; }

    public virtual DbSet<ClassNotification> ClassNotifications { get; set; }

    public virtual DbSet<ClassNotificationComment> ClassNotificationComments { get; set; }

    public virtual DbSet<ClassNotificationFile> ClassNotificationFiles { get; set; }

    public virtual DbSet<ClassNotificationReadStatus> ClassNotificationReadStatuses { get; set; }

    public virtual DbSet<Commune> Communes { get; set; }

    public virtual DbSet<Course> Courses { get; set; }

    public virtual DbSet<Document> Documents { get; set; }

    public virtual DbSet<DocumentCategory> DocumentCategories { get; set; }

    public virtual DbSet<Enrollment> Enrollments { get; set; }

    public virtual DbSet<ForumAppeal> ForumAppeals { get; set; }

    public virtual DbSet<ForumAttachment> ForumAttachments { get; set; }

    public virtual DbSet<ForumComment> ForumComments { get; set; }

    public virtual DbSet<ForumFlair> ForumFlairs { get; set; }

    public virtual DbSet<ForumPost> ForumPosts { get; set; }

    public virtual DbSet<ForumRule> ForumRules { get; set; }

    public virtual DbSet<Exam> Exams { get; set; }

    public virtual DbSet<ExamQuestion> ExamQuestions { get; set; }

    public virtual DbSet<ExamResult> ExamResults { get; set; }

    public virtual DbSet<LandingPage> LandingPages { get; set; }

    public virtual DbSet<LandingPageImage> LandingPageImages { get; set; }

    public virtual DbSet<Lesson> Lessons { get; set; }

    public virtual DbSet<LessonComment> LessonComments { get; set; }

    public virtual DbSet<LessonReading> LessonReadings { get; set; }

    public virtual DbSet<LessonResource> LessonResources { get; set; }

    public virtual DbSet<LessonVideo> LessonVideos { get; set; }

    public virtual DbSet<NotificationSubmission> NotificationSubmissions { get; set; }

    public virtual DbSet<PaymentInfo> PaymentInfos { get; set; }

    public virtual DbSet<Progress> Progresses { get; set; }

    public virtual DbSet<Province> Provinces { get; set; }

    public virtual DbSet<QAConversation> QAConversations { get; set; }

    public virtual DbSet<QAMessage> QAMessages { get; set; }

    public virtual DbSet<QATopic> QATopics { get; set; }

    public virtual DbSet<RulePattern> RulePatterns { get; set; }

    public virtual DbSet<School> Schools { get; set; }

    public virtual DbSet<Subject> Subjects { get; set; }

    public virtual DbSet<SubmissionFile> SubmissionFiles { get; set; }

    public virtual DbSet<Transaction> Transactions { get; set; }

    public virtual DbSet<UserForumStatus> UserForumStatuses { get; set; }

    public virtual DbSet<ViolationRecord> ViolationRecords { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_0900_ai_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<AppPolicy>(entity =>
        {
            entity.HasKey(e => new { e.RoleId, e.ResourceId })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.ToTable("app_policy");

            entity.HasIndex(e => e.ResourceId, "ResourceId");

            entity.Property(e => e.ActionType).HasMaxLength(100);
            entity.Property(e => e.Condition).HasMaxLength(256);
            entity.Property(e => e.Description)
                .HasMaxLength(256)
                .UseCollation("utf8mb3_general_ci")
                .HasCharSet("utf8mb3");

            entity.HasOne(d => d.Resource).WithMany(p => p.AppPolicies)
                .HasForeignKey(d => d.ResourceId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("app_policy_ibfk_2");

            entity.HasOne(d => d.Role).WithMany(p => p.AppPolicies)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("app_policy_ibfk_1");
        });

        modelBuilder.Entity<AppResource>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("app_resources");

            entity.Property(e => e.Name).HasMaxLength(256);
            entity.Property(e => e.ResourceType).HasMaxLength(100);
        });

        modelBuilder.Entity<AppRole>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("app_roles");

            entity.Property(e => e.Name).HasMaxLength(256);
        });

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("app_users");

            entity.HasIndex(e => e.CommuneId, "CommuneId");

            entity.HasIndex(e => e.Email, "Email").IsUnique();

            entity.HasIndex(e => e.PhoneNumber, "PhoneNumber").IsUnique();

            entity.HasIndex(e => e.Username, "Username").IsUnique();

            entity.Property(e => e.Address).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.EmailVerificationExpire).HasColumnType("datetime");
            entity.Property(e => e.Fullname).HasMaxLength(100);
            entity.Property(e => e.Gender)
                .IsRequired()
                .HasDefaultValueSql("'1'");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(64)
                .IsFixedLength();
            entity.Property(e => e.PhoneNumber).HasMaxLength(11);
            entity.Property(e => e.RefreshTokenExpire).HasColumnType("datetime");
            entity.Property(e => e.ResetPasswordExpire).HasColumnType("datetime");
            entity.Property(e => e.Status)
                .IsRequired()
                .HasDefaultValueSql("'1'");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.Username).HasMaxLength(100);

            entity.HasOne(d => d.Commune).WithMany(p => p.AppUsers)
                .HasForeignKey(d => d.CommuneId)
                .HasConstraintName("app_users_ibfk_1");

            entity.HasMany(d => d.Roles).WithMany(p => p.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "AppUserRole",
                    r => r.HasOne<AppRole>().WithMany()
                        .HasForeignKey("RoleId")
                        .HasConstraintName("app_user_role_ibfk_2"),
                    l => l.HasOne<AppUser>().WithMany()
                        .HasForeignKey("UserId")
                        .HasConstraintName("app_user_role_ibfk_1"),
                    j =>
                    {
                        j.HasKey("UserId", "RoleId")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("app_user_role");
                        j.HasIndex(new[] { "RoleId" }, "RoleId");
                    });
        });

        modelBuilder.Entity<AppUserSubjectClass>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.SubjectId, e.ClassId })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0, 0 });

            entity.ToTable("app_user_subject_class");

            entity.HasIndex(e => e.ClassId, "ClassId");

            entity.HasIndex(e => e.SubjectId, "SubjectId");

            entity.Property(e => e.JoinDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'joined'")
                .HasColumnType("enum('invited','joined','kicked')");

            entity.HasOne(d => d.Class).WithMany(p => p.AppUserSubjectClasses)
                .HasForeignKey(d => d.ClassId)
                .HasConstraintName("app_user_subject_class_ibfk_3");

            entity.HasOne(d => d.Subject).WithMany(p => p.AppUserSubjectClasses)
                .HasForeignKey(d => d.SubjectId)
                .HasConstraintName("app_user_subject_class_ibfk_2");

            entity.HasOne(d => d.User).WithMany(p => p.AppUserSubjectClasses)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("app_user_subject_class_ibfk_1");
        });

        modelBuilder.Entity<Chapter>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("chapters");

            entity.HasIndex(e => e.CourseId, "CourseId");

            entity.Property(e => e.Description).HasColumnType("text");
            entity.Property(e => e.Name).HasMaxLength(255);
            entity.Property(e => e.PostDate).HasColumnType("datetime");

            entity.HasOne(d => d.Course).WithMany(p => p.Chapters)
                .HasForeignKey(d => d.CourseId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("chapters_ibfk_1");
        });

        modelBuilder.Entity<City>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("cities");

            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<Class>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("classes");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
        });

        modelBuilder.Entity<ClassNotification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("class_notifications");

            entity.HasIndex(e => e.ClassId, "FK_ClassNotifications_Classes");

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.ClassId).HasColumnType("int(11)");
            entity.Property(e => e.CreatedAt)
                .HasMaxLength(6)
                .HasDefaultValueSql("current_timestamp(6)");
            entity.Property(e => e.Deadline).HasMaxLength(6);
            entity.Property(e => e.DeletedAt).HasMaxLength(6);
            entity.Property(e => e.Description)
                .HasMaxLength(5000)
                .UseCollation("utf8_general_ci")
                .HasCharSet("utf8");
            entity.Property(e => e.GradeType).HasMaxLength(50);
            entity.Property(e => e.InstructionsHtml).HasColumnType("text");
            entity.Property(e => e.MaxScore).HasPrecision(9, 2);
            entity.Property(e => e.Title)
                .HasMaxLength(200)
                .UseCollation("utf8_general_ci")
                .HasCharSet("utf8");
            entity.Property(e => e.Type)
                .HasDefaultValueSql("'notification'")
                .HasColumnType("enum('notification','classwork')");
            entity.Property(e => e.UpdatedAt).HasMaxLength(6);

            entity.HasOne(d => d.Class).WithMany(p => p.ClassNotifications)
                .HasForeignKey(d => d.ClassId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ClassNotifications_Classes");
        });

        modelBuilder.Entity<ClassNotificationComment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("class_notification_comments");

            entity.HasIndex(e => e.NotificationId, "FK_NotificationComments_Notifications");

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.Content).HasMaxLength(2000);
            entity.Property(e => e.CreatedAt)
                .HasMaxLength(6)
                .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");
            entity.Property(e => e.DeletedAt).HasMaxLength(6);
            entity.Property(e => e.UpdatedAt).HasMaxLength(6);

            entity.HasOne(d => d.Notification).WithMany(p => p.ClassNotificationComments)
                .HasForeignKey(d => d.NotificationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_NotificationComments_Notifications");
        });

        modelBuilder.Entity<ClassNotificationFile>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("class_notification_files");

            entity.HasIndex(e => e.NotificationId, "FK_NotificationFiles_Notifications");

            entity.Property(e => e.FileName).HasMaxLength(200);
            entity.Property(e => e.FileType).HasMaxLength(100);
            entity.Property(e => e.NotificationId).HasColumnType("int(11)");

            entity.HasOne(d => d.Notification).WithMany(p => p.ClassNotificationFiles)
                .HasForeignKey(d => d.NotificationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_NotificationFiles_Notifications");
        });

        modelBuilder.Entity<ClassNotificationReadStatus>(entity =>
        {
            entity.HasKey(e => new { e.NotificationId, e.AppUserId })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.ToTable("class_notification_read_status");

            entity.Property(e => e.NotificationId).HasColumnType("int(11)");
            entity.Property(e => e.ReadAt)
                .HasMaxLength(6)
                .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");

            entity.HasOne(d => d.Notification).WithMany(p => p.ClassNotificationReadStatuses)
                .HasForeignKey(d => d.NotificationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_NotificationRead_Notifications");
        });

        modelBuilder.Entity<Commune>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("communes");

            entity.HasIndex(e => e.ProvinceId, "ProvinceId");

            entity.Property(e => e.Name).HasMaxLength(100);

            entity.HasOne(d => d.Province).WithMany(p => p.Communes)
                .HasForeignKey(d => d.ProvinceId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("communes_ibfk_1");
        });

        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("courses");

            entity.HasIndex(e => e.SubjectId, "SubjectId");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.EndAt).HasColumnType("datetime");
            entity.Property(e => e.Information).HasMaxLength(1000);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.StartAt).HasColumnType("datetime");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'Mở'")
                .HasColumnType("enum('Mở','Đóng','Nháp')");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Subject).WithMany(p => p.Courses)
                .HasForeignKey(d => d.SubjectId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("courses_ibfk_1");
        });

        modelBuilder.Entity<Document>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("documents");

            entity.HasIndex(e => e.DocumentCategoryId, "DocumentCategoryId");

            entity.HasIndex(e => e.SchoolId, "SchoolId");

            entity.HasIndex(e => e.SubjectId, "SubjectId");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Status)
                .IsRequired()
                .HasDefaultValueSql("'1'");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.DocumentCategory).WithMany(p => p.Documents)
                .HasForeignKey(d => d.DocumentCategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("documents_ibfk_2");

            entity.HasOne(d => d.School).WithMany(p => p.Documents)
                .HasForeignKey(d => d.SchoolId)
                .HasConstraintName("documents_ibfk_3");

            entity.HasOne(d => d.Subject).WithMany(p => p.Documents)
                .HasForeignKey(d => d.SubjectId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("documents_ibfk_1");

            entity.HasMany(d => d.Classes).WithMany(p => p.Documents)
                .UsingEntity<Dictionary<string, object>>(
                    "DocumentClass",
                    r => r.HasOne<Class>().WithMany()
                        .HasForeignKey("ClassId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("document_classes_ibfk_2"),
                    l => l.HasOne<Document>().WithMany()
                        .HasForeignKey("DocumentId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("document_classes_ibfk_1"),
                    j =>
                    {
                        j.HasKey("DocumentId", "ClassId")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("document_classes");
                        j.HasIndex(new[] { "ClassId" }, "ClassId");
                    });
        });

        modelBuilder.Entity<DocumentCategory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("document_categories");

            entity.Property(e => e.Description).HasMaxLength(200);
            entity.Property(e => e.Name).HasMaxLength(200);
        });

        modelBuilder.Entity<Enrollment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("enrollments");

            entity.HasIndex(e => e.AppUserId, "AppUserId");

            entity.HasIndex(e => e.CourseId, "CourseId");

            entity.Property(e => e.EnrollmentDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");

            entity.HasOne(d => d.AppUser).WithMany(p => p.Enrollments)
                .HasForeignKey(d => d.AppUserId)
                .HasConstraintName("enrollments_ibfk_1");

            entity.HasOne(d => d.Course).WithMany(p => p.Enrollments)
                .HasForeignKey(d => d.CourseId)
                .HasConstraintName("enrollments_ibfk_2");
        });

        modelBuilder.Entity<ForumAppeal>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("forum_appeals");

            entity.HasIndex(e => e.SchoolId, "SchoolId");

            entity.HasIndex(e => e.UpdatedBy, "UpdatedBy");

            entity.HasIndex(e => e.UserId, "UserId");

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("current_timestamp()")
                .HasColumnType("datetime");
            entity.Property(e => e.Reason).HasMaxLength(2000);
            entity.Property(e => e.SchoolId).HasColumnType("int(11)");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.School).WithMany(p => p.ForumAppeals)
                .HasForeignKey(d => d.SchoolId)
                .HasConstraintName("forum_appeals_ibfk_2");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.ForumAppealUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("forum_appeals_ibfk_3");

            entity.HasOne(d => d.User).WithMany(p => p.ForumAppealUsers)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("forum_appeals_ibfk_1");
        });

        modelBuilder.Entity<ForumAttachment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("forum_attachments");

            entity.HasIndex(e => e.CommentId, "CommentId");

            entity.HasIndex(e => e.CreatedBy, "CreatedBy");

            entity.HasIndex(e => e.PostId, "PostId");

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.CommentId).HasColumnType("int(11)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("current_timestamp()")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.PostId).HasColumnType("int(11)");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Comment).WithMany(p => p.ForumAttachments)
                .HasForeignKey(d => d.CommentId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("forum_attachments_ibfk_2");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ForumAttachments)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("forum_attachments_ibfk_3");

            entity.HasOne(d => d.Post).WithMany(p => p.ForumAttachments)
                .HasForeignKey(d => d.PostId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("forum_attachments_ibfk_1");
        });

        modelBuilder.Entity<ForumComment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("forum_comments");

            entity.HasIndex(e => e.CreatedBy, "CreatedBy");

            entity.HasIndex(e => e.ParentCommentId, "ParentCommentId");

            entity.HasIndex(e => e.PostId, "PostId");

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("current_timestamp()")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.ParentCommentId).HasColumnType("int(11)");
            entity.Property(e => e.PostId).HasColumnType("int(11)");
            entity.Property(e => e.TotalViolationScore).HasColumnType("int(11)");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ForumComments)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("forum_comments_ibfk_3");

            entity.HasOne(d => d.ParentComment).WithMany(p => p.InverseParentComment)
                .HasForeignKey(d => d.ParentCommentId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("forum_comments_ibfk_2");

            entity.HasOne(d => d.Post).WithMany(p => p.ForumComments)
                .HasForeignKey(d => d.PostId)
                .HasConstraintName("forum_comments_ibfk_1");
        });

        modelBuilder.Entity<ForumFlair>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("forum_flairs");

            entity.HasIndex(e => e.CreatedBy, "CreatedBy");

            entity.HasIndex(e => e.SchoolId, "SchoolId");

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("current_timestamp()")
                .HasColumnType("datetime");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.SchoolId).HasColumnType("int(11)");
            entity.Property(e => e.Status)
                .IsRequired()
                .HasDefaultValueSql("'1'");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ForumFlairs)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("forum_flairs_ibfk_2");

            entity.HasOne(d => d.School).WithMany(p => p.ForumFlairs)
                .HasForeignKey(d => d.SchoolId)
                .HasConstraintName("forum_flairs_ibfk_1");
        });

        modelBuilder.Entity<ForumPost>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("forum_posts");

            entity.HasIndex(e => e.CreatedBy, "CreatedBy");

            entity.HasIndex(e => e.FlairId, "FlairId");

            entity.HasIndex(e => e.SchoolId, "SchoolId");

            entity.HasIndex(e => e.SubjectId, "SubjectId");

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("current_timestamp()")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.FlairId).HasColumnType("int(11)");
            entity.Property(e => e.SchoolId).HasColumnType("int(11)");
            entity.Property(e => e.SubjectId).HasColumnType("smallint(6)");
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.TotalViolationScore).HasColumnType("int(11)");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ForumPosts)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("forum_posts_ibfk_4");

            entity.HasOne(d => d.Flair).WithMany(p => p.ForumPosts)
                .HasForeignKey(d => d.FlairId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("forum_posts_ibfk_3");

            entity.HasOne(d => d.School).WithMany(p => p.ForumPosts)
                .HasForeignKey(d => d.SchoolId)
                .HasConstraintName("forum_posts_ibfk_1");

            entity.HasOne(d => d.Subject).WithMany(p => p.ForumPosts)
                .HasForeignKey(d => d.SubjectId)
                .HasConstraintName("forum_posts_ibfk_2");
        });

        modelBuilder.Entity<ForumRule>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("forum_rules");

            entity.HasIndex(e => e.CreatedBy, "CreatedBy");

            entity.HasIndex(e => e.SchoolId, "SchoolId");

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("current_timestamp()")
                .HasColumnType("datetime");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValueSql("'1'");
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.RuleType).HasMaxLength(100);
            entity.Property(e => e.SchoolId).HasColumnType("int(11)");
            entity.Property(e => e.Severity).HasMaxLength(50);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.ViolationScore).HasColumnType("int(11)");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ForumRules)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("forum_rules_ibfk_2");

            entity.HasOne(d => d.School).WithMany(p => p.ForumRules)
                .HasForeignKey(d => d.SchoolId)
                .HasConstraintName("forum_rules_ibfk_1");
        });

        modelBuilder.Entity<Exam>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("exams");

            entity.HasIndex(e => e.ClassId, "ClassId");

            entity.HasIndex(e => e.LessonId, "LessonId").IsUnique();

            entity.Property(e => e.Attempts).HasDefaultValueSql("'1'");
            entity.Property(e => e.CloseTime).HasColumnType("datetime");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.OpenTime)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.ShowAnswers)
                .IsRequired()
                .HasDefaultValueSql("'1'");
            entity.Property(e => e.Title).HasMaxLength(500);

            entity.HasOne(d => d.Class).WithMany(p => p.Exams)
                .HasForeignKey(d => d.ClassId)
                .HasConstraintName("exams_ibfk_1");
        });

        modelBuilder.Entity<ExamQuestion>(entity =>
        {
            entity.HasKey(e => e.QuestionObjectId).HasName("PRIMARY");

            entity.ToTable("exam_questions");

            entity.HasIndex(e => e.ExamId, "ExamId");

            entity.Property(e => e.QuestionObjectId)
                .HasMaxLength(24)
                .IsFixedLength();

            entity.HasOne(d => d.Exam).WithMany(p => p.ExamQuestions)
                .HasForeignKey(d => d.ExamId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("exam_questions_ibfk_1");
        });

        modelBuilder.Entity<ExamResult>(entity =>
        {
            entity.HasKey(e => e.ResultObjectId).HasName("PRIMARY");

            entity.ToTable("exam_results");

            entity.HasIndex(e => e.ExamId, "ExamId");

            entity.HasIndex(e => e.StudentId, "StudentId");

            entity.Property(e => e.ResultObjectId)
                .HasMaxLength(24)
                .IsFixedLength();
            entity.Property(e => e.CheatTimes)
                .HasDefaultValueSql("'0'")
                .HasColumnType("mediumint");
            entity.Property(e => e.FinishTime).HasColumnType("datetime");
            entity.Property(e => e.Score).HasPrecision(4, 2);
            entity.Property(e => e.SubmissionTime).HasColumnType("datetime");

            entity.HasOne(d => d.Exam).WithMany(p => p.ExamResults)
                .HasForeignKey(d => d.ExamId)
                .HasConstraintName("exam_results_ibfk_1");

            entity.HasOne(d => d.Student).WithMany(p => p.ExamResults)
                .HasForeignKey(d => d.StudentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("exam_results_ibfk_2");
        });

        modelBuilder.Entity<LandingPage>(entity =>
        {
            entity.HasKey(e => e.SchoolId).HasName("PRIMARY");

            entity.ToTable("landing_pages");

            entity.Property(e => e.SchoolId).ValueGeneratedNever();
            entity.Property(e => e.Description).HasMaxLength(500);

            entity.HasOne(d => d.School).WithOne(p => p.LandingPage)
                .HasForeignKey<LandingPage>(d => d.SchoolId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("landing_pages_ibfk_1");
        });

        modelBuilder.Entity<LandingPageImage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("landing_page_images");

            entity.HasIndex(e => e.LandingPageId, "LandingPageId");

            entity.Property(e => e.Id).ValueGeneratedNever();

            entity.HasOne(d => d.LandingPage).WithMany(p => p.LandingPageImages)
                .HasForeignKey(d => d.LandingPageId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("landing_page_images_ibfk_1");
        });

        modelBuilder.Entity<Lesson>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("lessons");

            entity.HasIndex(e => e.ChapterId, "ChapterId");

            entity.HasIndex(e => e.ResourceId, "ResourceId");

            entity.Property(e => e.Description).HasColumnType("text");
            entity.Property(e => e.Duration).HasMaxLength(100);
            entity.Property(e => e.IsPreview).HasDefaultValueSql("'0'");
            entity.Property(e => e.Name).HasMaxLength(255);
            entity.Property(e => e.PostDate).HasColumnType("datetime");
            entity.Property(e => e.Type)
                .HasDefaultValueSql("'Video'")
                .HasColumnType("enum('Reading','Video','Exam')");

            entity.HasOne(d => d.Chapter).WithMany(p => p.Lessons)
                .HasForeignKey(d => d.ChapterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("lessons_ibfk_1");

            entity.HasOne(d => d.Resource).WithMany(p => p.Lessons)
                .HasForeignKey(d => d.ResourceId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("lessons_ibfk_2");
        });

        modelBuilder.Entity<LessonComment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("lesson_comments");

            entity.HasIndex(e => e.AppUserId, "FK_LessonComments_AppUser");

            entity.HasIndex(e => e.LessonId, "FK_LessonComments_Lesson");

            entity.Property(e => e.Content).HasMaxLength(2000);
            entity.Property(e => e.CreatedAt)
                .HasMaxLength(6)
                .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");
            entity.Property(e => e.DeletedAt).HasMaxLength(6);
            entity.Property(e => e.UpdatedAt).HasMaxLength(6);

            entity.HasOne(d => d.AppUser).WithMany(p => p.LessonComments)
                .HasForeignKey(d => d.AppUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LessonComments_AppUser");

            entity.HasOne(d => d.Lesson).WithMany(p => p.LessonComments)
                .HasForeignKey(d => d.LessonId)
                .HasConstraintName("FK_LessonComments_Lesson");
        });

        modelBuilder.Entity<LessonReading>(entity =>
        {
            entity.HasKey(e => e.LessonId).HasName("PRIMARY");

            entity.ToTable("lesson_reading");

            entity.Property(e => e.LessonId).ValueGeneratedNever();

            entity.HasOne(d => d.Lesson).WithOne(p => p.LessonReading)
                .HasForeignKey<LessonReading>(d => d.LessonId)
                .HasConstraintName("lesson_reading_ibfk_1");
        });

        modelBuilder.Entity<LessonResource>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("lesson_resource");
        });

        modelBuilder.Entity<LessonVideo>(entity =>
        {
            entity.HasKey(e => e.LessonId).HasName("PRIMARY");

            entity.ToTable("lesson_video");

            entity.Property(e => e.LessonId).ValueGeneratedNever();

            entity.HasOne(d => d.Lesson).WithOne(p => p.LessonVideo)
                .HasForeignKey<LessonVideo>(d => d.LessonId)
                .HasConstraintName("lesson_video_ibfk_1");
        });

        modelBuilder.Entity<NotificationSubmission>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("notification_submissions");

            entity.HasIndex(e => e.NotificationId, "FK_Submissions_Notifications");

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.Feedback).HasColumnType("text");
            entity.Property(e => e.FirstSubmissionTime)
                .HasMaxLength(6)
                .HasDefaultValueSql("current_timestamp(6)");
            entity.Property(e => e.GradedAt).HasMaxLength(6);
            entity.Property(e => e.LatestSubmissionTime)
                .HasMaxLength(6)
                .HasDefaultValueSql("current_timestamp(6)");
            entity.Property(e => e.NotificationId).HasColumnType("int(11)");
            entity.Property(e => e.Score).HasPrecision(9, 2);
            entity.Property(e => e.SubmissionStatus)
                .HasMaxLength(50)
                .HasDefaultValueSql("'submitted'");

            entity.HasOne(d => d.Notification).WithMany(p => p.NotificationSubmissions)
                .HasForeignKey(d => d.NotificationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Submissions_Notifications");
        });

        modelBuilder.Entity<PaymentInfo>(entity =>
        {
            entity.HasKey(e => e.SchoolId).HasName("PRIMARY");

            entity.ToTable("payment_info");

            entity.Property(e => e.SchoolId).ValueGeneratedNever();
            entity.Property(e => e.AccountBank).HasMaxLength(20);
            entity.Property(e => e.AccountName).HasMaxLength(100);
            entity.Property(e => e.AccountNumber).HasMaxLength(20);
            entity.Property(e => e.ExchangeRate).HasColumnType("mediumint");
            entity.Property(e => e.QrcodeUrl).HasColumnName("QRCodeUrl");

            entity.HasOne(d => d.School).WithOne(p => p.PaymentInfo)
                .HasForeignKey<PaymentInfo>(d => d.SchoolId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("payment_info_ibfk_1");
        });

        modelBuilder.Entity<Progress>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("progress");

            entity.HasIndex(e => e.EnrollmentId, "EnrollmentId");

            entity.HasIndex(e => e.LessonId, "LessonId");

            entity.Property(e => e.CompletionDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Enrollment).WithMany(p => p.Progresses)
                .HasForeignKey(d => d.EnrollmentId)
                .HasConstraintName("progress_ibfk_1");

            entity.HasOne(d => d.Lesson).WithMany(p => p.Progresses)
                .HasForeignKey(d => d.LessonId)
                .HasConstraintName("progress_ibfk_2");
        });

        modelBuilder.Entity<Province>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("provinces");

            entity.HasIndex(e => e.CityId, "CityId");

            entity.Property(e => e.Name).HasMaxLength(100);

            entity.HasOne(d => d.City).WithMany(p => p.Provinces)
                .HasForeignKey(d => d.CityId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("provinces_ibfk_1");
        });

        modelBuilder.Entity<QAConversation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("q&_a_conversation");

            entity.HasIndex(e => e.StudentId, "StudentId");

            entity.HasIndex(e => e.TeacherId, "TeacherId");

            entity.HasIndex(e => e.TopicId, "TopicId");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Title).HasMaxLength(255);
            entity.Property(e => e.Type).HasColumnType("enum('AI','Teacher')");

            entity.HasOne(d => d.Student).WithMany(p => p.QAConversationStudents)
                .HasForeignKey(d => d.StudentId)
                .HasConstraintName("q&_a_conversation_ibfk_1");

            entity.HasOne(d => d.Teacher).WithMany(p => p.QAConversationTeachers)
                .HasForeignKey(d => d.TeacherId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("q&_a_conversation_ibfk_2");

            entity.HasOne(d => d.Topic).WithMany(p => p.QAConversations)
                .HasForeignKey(d => d.TopicId)
                .HasConstraintName("q&_a_conversation_ibfk_3");
        });

        modelBuilder.Entity<QAMessage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("q&_a_message");

            entity.HasIndex(e => e.ConversationId, "ConversationId");

            entity.HasIndex(e => e.SenderId, "SenderId");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.IsFromAi).HasColumnName("IsFromAI");

            entity.HasOne(d => d.Conversation).WithMany(p => p.QAMessages)
                .HasForeignKey(d => d.ConversationId)
                .HasConstraintName("q&_a_message_ibfk_1");

            entity.HasOne(d => d.Sender).WithMany(p => p.QAMessages)
                .HasForeignKey(d => d.SenderId)
                .HasConstraintName("q&_a_message_ibfk_2");
        });

        modelBuilder.Entity<QATopic>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("q&_a_topic");

            entity.HasIndex(e => e.SubjectId, "SubjectId");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValueSql("'1'");
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Subject).WithMany(p => p.QATopics)
                .HasForeignKey(d => d.SubjectId)
                .HasConstraintName("q&_a_topic_ibfk_1");
        });

        modelBuilder.Entity<RulePattern>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("rule_patterns");

            entity.HasIndex(e => e.CreatedBy, "CreatedBy");

            entity.HasIndex(e => e.RuleId, "RuleId");

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("current_timestamp()")
                .HasColumnType("datetime");
            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValueSql("'1'");
            entity.Property(e => e.Pattern).HasMaxLength(500);
            entity.Property(e => e.RuleId).HasColumnType("int(11)");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.RulePatterns)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("rule_patterns_ibfk_2");

            entity.HasOne(d => d.Rule).WithMany(p => p.RulePatterns)
                .HasForeignKey(d => d.RuleId)
                .HasConstraintName("rule_patterns_ibfk_1");
        });

        modelBuilder.Entity<School>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("schools");

            entity.HasIndex(e => e.CommuneId, "CommuneId");

            entity.Property(e => e.Address).HasMaxLength(1000);
            entity.Property(e => e.Name).HasMaxLength(200);

            entity.HasOne(d => d.Commune).WithMany(p => p.Schools)
                .HasForeignKey(d => d.CommuneId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("schools_ibfk_1");
        });

        modelBuilder.Entity<Subject>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("subjects");

            entity.Property(e => e.Name).HasMaxLength(200);
        });

        modelBuilder.Entity<SubmissionFile>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("submission_files");

            entity.HasIndex(e => e.SubmissionId, "FK_SubmissionFiles_Submissions");

            entity.Property(e => e.FileName).HasMaxLength(200);

            entity.HasOne(d => d.Submission).WithMany(p => p.SubmissionFiles)
                .HasForeignKey(d => d.SubmissionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SubmissionFiles_Submissions");
        });

        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("transactions");

            entity.HasIndex(e => e.ConversationId, "ConversationId");

            entity.HasIndex(e => e.CourseId, "CourseId");

            entity.HasIndex(e => e.TransactionCode, "TransactionCode").IsUnique();

            entity.HasIndex(e => e.UserId, "UserId");

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.Amount).HasColumnType("bigint(20)");
            entity.Property(e => e.CourseId).HasColumnType("int(11)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("current_timestamp()")
                .HasColumnType("datetime");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.ProcessedAt).HasColumnType("datetime");
            entity.Property(e => e.QrcodeUrl).HasColumnName("QRCodeUrl");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'Pending'")
                .HasColumnType("enum('Pending','Success','Failed','Cancelled')");
            entity.Property(e => e.TransactionCode).HasMaxLength(100);
            entity.Property(e => e.Type).HasColumnType("enum('Deposit','Withdraw','Refund')");

            entity.HasOne(d => d.Conversation).WithMany(p => p.Transactions)
                .HasForeignKey(d => d.ConversationId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("transactions_ibfk_3");

            entity.HasOne(d => d.Course).WithMany(p => p.Transactions)
                .HasForeignKey(d => d.CourseId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("transactions_ibfk_2");

            entity.HasOne(d => d.User).WithMany(p => p.Transactions)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("transactions_ibfk_1");
        });

        modelBuilder.Entity<UserForumStatus>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.SchoolId })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.ToTable("user_forum_status");

            entity.HasIndex(e => e.SchoolId, "SchoolId");

            entity.Property(e => e.SchoolId).HasColumnType("int(11)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("current_timestamp()")
                .HasColumnType("datetime");
            entity.Property(e => e.MuteUntil).HasColumnType("datetime");
            entity.Property(e => e.TotalViolationScore)
                .HasDefaultValueSql("'100'")
                .HasColumnType("int(11)");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.School).WithMany(p => p.UserForumStatuses)
                .HasForeignKey(d => d.SchoolId)
                .HasConstraintName("user_forum_status_ibfk_2");

            entity.HasOne(d => d.User).WithMany(p => p.UserForumStatuses)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("user_forum_status_ibfk_1");
        });

        modelBuilder.Entity<ViolationRecord>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("violation_records");

            entity.HasIndex(e => e.CommentId, "CommentId");

            entity.HasIndex(e => e.MatchedPatternId, "MatchedPatternId");

            entity.HasIndex(e => e.MatchedRuleId, "MatchedRuleId");

            entity.HasIndex(e => e.PostId, "PostId");

            entity.HasIndex(e => e.ReportedBy, "ReportedBy");

            entity.HasIndex(e => e.SchoolId, "SchoolId");

            entity.HasIndex(e => e.UserId, "UserId");

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.CommentId).HasColumnType("int(11)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("current_timestamp()")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.MatchedPatternId).HasColumnType("int(11)");
            entity.Property(e => e.MatchedRuleId).HasColumnType("int(11)");
            entity.Property(e => e.PostId).HasColumnType("int(11)");
            entity.Property(e => e.SchoolId).HasColumnType("int(11)");
            entity.Property(e => e.SourceType)
                .HasDefaultValueSql("'auto'")
                .HasColumnType("enum('auto','report','manual')");
            entity.Property(e => e.ViolationScore).HasColumnType("int(11)");

            entity.HasOne(d => d.Comment).WithMany(p => p.ViolationRecords)
                .HasForeignKey(d => d.CommentId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("violation_records_ibfk_4");

            entity.HasOne(d => d.MatchedPattern).WithMany(p => p.ViolationRecords)
                .HasForeignKey(d => d.MatchedPatternId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("violation_records_ibfk_6");

            entity.HasOne(d => d.MatchedRule).WithMany(p => p.ViolationRecords)
                .HasForeignKey(d => d.MatchedRuleId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("violation_records_ibfk_5");

            entity.HasOne(d => d.Post).WithMany(p => p.ViolationRecords)
                .HasForeignKey(d => d.PostId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("violation_records_ibfk_3");

            entity.HasOne(d => d.ReportedByNavigation).WithMany(p => p.ViolationRecordReportedByNavigations)
                .HasForeignKey(d => d.ReportedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("violation_records_ibfk_7");

            entity.HasOne(d => d.School).WithMany(p => p.ViolationRecords)
                .HasForeignKey(d => d.SchoolId)
                .HasConstraintName("violation_records_ibfk_2");

            entity.HasOne(d => d.User).WithMany(p => p.ViolationRecordUsers)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("violation_records_ibfk_1");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
