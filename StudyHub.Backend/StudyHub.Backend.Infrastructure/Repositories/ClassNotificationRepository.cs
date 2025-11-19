using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class ClassNotificationRepository: IClassNotificationRepository
    {
        private readonly Data.AppDbContext _context;
        public ClassNotificationRepository (Data.AppDbContext context)
        {
            _context = context;
        }
        // === Notifications ===
        public List<ClassNotification> GetNotifications(int classId)
        {
            return _context.ClassNotifications
                .Where(n => n.ClassId == classId && n.DeletedAt == null)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new ClassNotification
                {
                    Id = n.Id,
                    ClassId = n.ClassId,
                    Type = n.Type,
                    Title = n.Title,
                    Description = n.Description,
                    CreatedAt = n.CreatedAt,
                    UpdatedAt = n.UpdatedAt,
                    DeletedAt = n.DeletedAt,
                    AppUserId = n.AppUserId,
                    Deadline = n.Deadline,
                    MaxScore = n.MaxScore,
                    AllowSubmission = n.AllowSubmission,
                    GradeType = n.GradeType,
                    InstructionsHtml = n.InstructionsHtml
                }).ToList();
        }

        public ClassNotification CreateNotification(ClassNotification notification)
        {
            var entity = new Data.ClassNotification
            {
                ClassId = notification.ClassId,
                Type = notification.Type ?? "notification",
                Title = notification.Title,
                Description = notification.Description,
                CreatedAt = DateTime.UtcNow,
                AppUserId = notification.AppUserId,
                Deadline = notification.Deadline,
                MaxScore = notification.MaxScore,
                AllowSubmission = notification.AllowSubmission,
                GradeType = notification.GradeType,
                InstructionsHtml = notification.InstructionsHtml
            };
            _context.ClassNotifications.Add(entity);
            _context.SaveChanges();
            notification.Id = entity.Id;
            return notification;
        }

        public ClassNotification EditNotification(ClassNotification notification)
        {
            var entity = _context.ClassNotifications.FirstOrDefault(n => n.Id == notification.Id);
            if (entity == null) return null;
            entity.Title = notification.Title;
            entity.Description = notification.Description;
            entity.Deadline = notification.Deadline;
            entity.MaxScore = notification.MaxScore;
            entity.AllowSubmission = notification.AllowSubmission;
            entity.GradeType = notification.GradeType;
            entity.InstructionsHtml = notification.InstructionsHtml;
            entity.UpdatedAt = DateTime.UtcNow;
            _context.ClassNotifications.Update(entity);
            _context.SaveChanges();
            return notification;
        }

        public ClassNotification GetNotification(int notificationId)
        {
            var n = _context.ClassNotifications.FirstOrDefault(x => x.Id == notificationId);
            if (n == null) return null;
            return new ClassNotification
            {
                Id = n.Id,
                ClassId = n.ClassId,
                Type = n.Type,
                Title = n.Title,
                Description = n.Description,
                CreatedAt = n.CreatedAt,
                UpdatedAt = n.UpdatedAt,
                DeletedAt = n.DeletedAt,
                AppUserId = n.AppUserId,
                Deadline = n.Deadline,
                MaxScore = n.MaxScore,
                AllowSubmission = n.AllowSubmission,
                GradeType = n.GradeType,
                InstructionsHtml = n.InstructionsHtml
            };
        }

        public bool DeleteNotification(int id)
        {
            var noti = _context.ClassNotifications.FirstOrDefault(c => c.Id == id);
            if (noti != null)
            {
                noti.DeletedAt = DateTime.UtcNow;
                _context.ClassNotifications.Update(noti);
                _context.SaveChanges();
                return true;
            }
            return false;
        }

        // === Comments & Files ===
        public ClassNotificationComment CreateComment(ClassNotificationComment comment)
        {
            var ent = new Data.ClassNotificationComment
            {
                NotificationId = comment.NotificationId,
                AppUserId = comment.AppUserId,
                Content = comment.Content,
                CreatedAt = DateTime.UtcNow
            };
            _context.ClassNotificationComments.Add(ent);
            _context.SaveChanges();
            comment.Id = ent.Id;
            return comment;
        }

        public List<ClassNotificationComment> GetCommentsByNotificationId(int notificationId)
        {
            return _context.ClassNotificationComments
                .Where(c => c.NotificationId == notificationId && c.DeletedAt == null)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new ClassNotificationComment
                {
                    Id = c.Id,
                    NotificationId = c.NotificationId,
                    AppUserId = c.AppUserId,
                    Content = c.Content,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    DeletedAt = c.DeletedAt
                }).ToList();
        }

        public ClassNotificationFile CreateNotificationFile(ClassNotificationFile file)
        {
            var ent = new Data.ClassNotificationFile
            {
                FileName = file.FileName,
                FileUrl = file.FileUrl,
                NotificationId = file.NotificationId,
                ThumbnailUrl = file.ThumbnailUrl,
                FileType = file.FileType
            };
            _context.ClassNotificationFiles.Add(ent);
            _context.SaveChanges();
            file.Id = ent.Id;
            return file;
        }

        public List<ClassNotificationFile> GetFilesByNotification(int notificationId)
        {
            return _context.ClassNotificationFiles
                .Where(f => f.NotificationId == notificationId)
                .Select(f => new ClassNotificationFile
                {
                    Id = f.Id,
                    NotificationId = f.NotificationId,
                    FileName = f.FileName,
                    FileUrl = f.FileUrl,
                    ThumbnailUrl = f.ThumbnailUrl,
                    FileType = f.FileType
                }).ToList();
        }

        // === Submissions (assignment) ===
        public NotificationSubmission SubmitNotification(NotificationSubmission submission, List<SubmissionFile> files)
        {
            var ent = new Data.NotificationSubmission
            {
                NotificationId = submission.NotificationId,
                AppUserId = submission.AppUserId,
                FirstSubmissionTime = DateTime.UtcNow,
                LatestSubmissionTime = DateTime.UtcNow,
                SubmissionStatus = submission.SubmissionStatus ?? "submitted"
            };
            _context.NotificationSubmissions.Add(ent);
            _context.SaveChanges();

            submission.Id = ent.Id;

            if (files != null && files.Any())
            {
                foreach (var f in files)
                {
                    var fileEnt = new Data.SubmissionFile
                    {
                        SubmissionId = ent.Id,
                        FileName = f.FileName,
                        FileUrl = f.FileUrl
                    };
                    _context.SubmissionFiles.Add(fileEnt);
                }
                _context.SaveChanges();
            }

            return submission;
        }

        public NotificationSubmission ResubmitNotification(int submissionId, List<SubmissionFile> files)
        {
            var ent = _context.NotificationSubmissions.FirstOrDefault(s => s.Id == submissionId);
            if (ent == null) return null;
            ent.LatestSubmissionTime = DateTime.UtcNow;
            _context.NotificationSubmissions.Update(ent);

            var existing = _context.SubmissionFiles.Where(f => f.SubmissionId == submissionId).ToList();
            if (existing.Any())
            {
                _context.SubmissionFiles.RemoveRange(existing);
            }
            _context.SaveChanges();

            if (files != null && files.Any())
            {
                foreach (var f in files)
                {
                    var fe = new Data.SubmissionFile
                    {
                        SubmissionId = submissionId,
                        FileName = f.FileName,
                        FileUrl = f.FileUrl
                    };
                    _context.SubmissionFiles.Add(fe);
                }
                _context.SaveChanges();
            }

            return new NotificationSubmission
            {
                Id = ent.Id,
                NotificationId = ent.NotificationId,
                AppUserId = ent.AppUserId,
                FirstSubmissionTime = ent.FirstSubmissionTime,
                LatestSubmissionTime = ent.LatestSubmissionTime,
                Score = ent.Score,
                GradedAt = ent.GradedAt,
                GradedBy = ent.GradedBy,
                Feedback = ent.Feedback,
                SubmissionStatus = ent.SubmissionStatus
            };
        }

        public List<NotificationSubmission> GetSubmissionsByNotificationId(int notificationId)
        {
            return _context.NotificationSubmissions
                .Where(s => s.NotificationId == notificationId)
                .Select(s => new NotificationSubmission
                {
                    Id = s.Id,
                    NotificationId = s.NotificationId,
                    AppUserId = s.AppUserId,
                    FirstSubmissionTime = s.FirstSubmissionTime,
                    LatestSubmissionTime = s.LatestSubmissionTime,
                    Score = s.Score,
                    GradedAt = s.GradedAt,
                    GradedBy = s.GradedBy,
                    Feedback = s.Feedback,
                    SubmissionStatus = s.SubmissionStatus
                }).ToList();
        }

        public NotificationSubmission GetSubmissionByUserAndNotification(int notificationId, Guid userId)
        {
            var s = _context.NotificationSubmissions.FirstOrDefault(x => x.NotificationId == notificationId && x.AppUserId == userId);
            if (s == null) return null;
            return new NotificationSubmission
            {
                Id = s.Id,
                NotificationId = s.NotificationId,
                AppUserId = s.AppUserId,
                FirstSubmissionTime = s.FirstSubmissionTime,
                LatestSubmissionTime = s.LatestSubmissionTime,
                Score = s.Score,
                GradedAt = s.GradedAt,
                GradedBy = s.GradedBy,
                Feedback = s.Feedback,
                SubmissionStatus = s.SubmissionStatus
            };
        }
        public bool GradeSubmission(decimal score, int notificationSubmissionId, Guid gradeBy, string feedback)
        {
            var submission = _context.NotificationSubmissions.FirstOrDefault(a=>a.Id == notificationSubmissionId);
            if (submission == null) return false;
            submission.Score = score;
            submission.GradedAt= DateTime.Now;
            submission.GradedBy = gradeBy;
            submission.Feedback = feedback;
            _context.NotificationSubmissions.Update(submission);
            _context.SaveChanges();
            return true;

        }

        public SubmissionFile AddSubmissionFile(SubmissionFile file)
        {
            var ent = new Data.SubmissionFile
            {
                SubmissionId = file.SubmissionId,
                FileName = file.FileName,
                FileUrl = file.FileUrl
            };
            _context.SubmissionFiles.Add(ent);
            _context.SaveChanges();
            file.Id = ent.Id;
            return file;
        }

        public List<SubmissionFile> GetSubmissionFiles(int submissionId)
        {
            return _context.SubmissionFiles
                .Where(f => f.SubmissionId == submissionId)
                .Select(f => new SubmissionFile
                {
                    Id = f.Id,
                    SubmissionId = f.SubmissionId,
                    FileName = f.FileName,
                    FileUrl = f.FileUrl
                }).ToList();
        }

        public int GetSubmissionCount(int notificationId)
        {
            return _context.NotificationSubmissions.Count(s => s.NotificationId == notificationId);
        }

        public int GetMemberCountByNotification(int notificationId)
        {
            var notification = _context.ClassNotifications.FirstOrDefault(n => n.Id == notificationId);
            if (notification == null) return 0;
            var classId = notification.ClassId;

            var classEntity = _context.AppUserClasses
                .Include(c => c.User)
                .Where(c => c.ClassId == classId && c.User.Roles.Any(r => r.Name.Contains("Student")))
                .GroupBy(a => a.UserId)
                .ToList();

            return classEntity.Count();
        }

        public int GetMemberClassCount(int classID)
        {
            return _context.AppUserClasses.Where(a => a.ClassId == classID).GroupBy(a => a.UserId).Count();
        }
    }
}
