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
        public List<ClassNotification> GetClassNotifications(int classId)
        {
            return _context.ClassNotifications
                .Where(n => n.ClassId == classId && n.DeletedAt == null)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new ClassNotification
                {
                    Id = n.Id,
                    ClassId = n.ClassId,
                    Title = n.Title,
                    Description = n.Description,
                    CreatedAt = n.CreatedAt,
                    DeletedAt = n.DeletedAt,
                    UpdatedAt = n.UpdatedAt,
                    AppUserId = n.AppUserId
                }).ToList();
        }
        // ===================== NOTIFICATION =====================
        public ClassNotification CreateNotification(ClassNotification notification)
        {
            var classesnoti = new Data.ClassNotification
            {
                ClassId = notification.ClassId,
                Title = notification.Title,
                Description = notification.Description,
                CreatedAt = DateTime.Now,


                AppUserId = notification.CreatedBy,
            };
            _context.ClassNotifications.Add(classesnoti);
            _context.SaveChanges();
            notification.Id = classesnoti.Id;
            return notification;
        }

        public List<ClassNotification> GetNotificationsByClassId(int classId)
        {
            var nos = _context.ClassNotifications
                .Where(n => n.ClassId == classId)
                .Include(n => n.AppUser)
                .OrderByDescending(n => n.Title)
                .Select(n => new ClassNotification
                {
                    Id = n.Id,
                    ClassId = n.ClassId,
                    Title = n.Title,
                    Description = n.Description,
                    CreatedAt = n.CreatedAt,
                    DeletedAt = n.DeletedAt,
                    UpdatedAt = n.UpdatedAt,
                    AppUserId = n.AppUserId

                });
            return nos.ToList();
        }

        // ===================== COMMENT =====================
        public ClassNotificationComment CreateComment(ClassNotificationComment comment)
        {
            var com = new Data.ClassNotificationComment
            {
                Id = comment.Id,
                NotificationId = comment.NotificationId,
                AppUserId = comment.AppUserId,
                Content = comment.Content,

            };
            _context.ClassNotificationComments.Add(com);
            _context.SaveChanges();
            return comment;
        }

        public List<ClassNotificationComment> GetCommentsByNotificationId(int notificationId)
        {
            // Gồm cả comment cha và các reply comment
            var allComments = _context.ClassNotificationComments
                .Include(c => c.AppUser)
                .Where(c => c.NotificationId == notificationId)
                .OrderBy(c => c.Content)
                .ToList();

            // Nếu muốn, có thể build cây reply ở tầng Service sau này.
            return allComments.Select(a => new ClassNotificationComment
            {
                Id = a.Id,
                NotificationId = a.NotificationId,
                AppUserId = a.AppUserId,
                Content = a.Content,
                CreatedAt = a.CreatedAt,
                DeletedAt = a.DeletedAt,
                UpdatedAt = a.UpdatedAt,
            }).ToList();
        }

        public ClassNotificationFile CreateSubmissionFile(ClassNotificationFile file)
        {
            var subfile = new Data.ClassNotificationFile
            {
                FileName = file.FileName,
                FileUrl = file.FileUrl,
                NotificationId = file.NotificationId,
            };
            _context.ClassNotificationFiles.Add(subfile);
            _context.SaveChanges();
            file.Id = subfile.Id;
            file.FileName = subfile.FileName;
            file.FileUrl = subfile.FileUrl;

            return file;
        }

        public List<ClassNotificationFile> GetFileByNotificationId(int notificationId)
        {
            var noti = _context.ClassNotifications.Include(a => a.ClassNotificationFiles).FirstOrDefault(a => a.Id == notificationId);
            var files = noti.ClassNotificationFiles.Select(a => new ClassNotificationFile
            {
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                NotificationId = a.NotificationId,
                Id = a.Id
            }).ToList();
            return files;
        }

       
        public ClassNotificationComment CommentNoti(ClassNotificationComment comment)
        {
            var commented = new Data.ClassNotificationComment
            {
                NotificationId = comment.NotificationId,
                AppUserId = comment.AppUserId,
                Content = comment.Content,
                CreatedAt = DateTime.Now,
            };
            _context.ClassNotificationComments.Add(commented);
            _context.SaveChanges();
            comment.Id = commented.Id;
            return comment;

        }
        public bool DeleteNotification(int id)
        {
            var comment = _context.ClassNotifications.FirstOrDefault(c => c.Id == id);
            if (comment != null)
            {
                comment.DeletedAt = DateTime.Now;
                _context.ClassNotifications.Update(comment);
                _context.SaveChanges();
                return true;
            }
            return false;
        }
        public ClassNotification GetNotificationByID(int notificationId)
        {
            var noti = _context.ClassNotifications.FirstOrDefault(c => c.Id == notificationId);
            var noti2 = new ClassNotification
            {
                Id = notificationId,
                ClassId = noti.ClassId,
                Title = noti.Title,
                Description = noti.Description,
                AppUserId = noti.AppUserId,
                DeletedAt = noti.DeletedAt,
                CreatedAt = noti.CreatedAt,
                UpdatedAt = noti.UpdatedAt,
            };
            return noti2;
        }
    }
}
