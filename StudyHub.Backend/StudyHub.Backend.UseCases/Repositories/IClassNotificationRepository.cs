using StudyHub.Backend.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IClassNotificationRepository
    {
        List<ClassNotification> GetClassNotifications(int classId);
        ClassNotification CreateNotification(ClassNotification notification);
        ClassNotification GetNotificationByID(int notificationId);
        List<ClassNotification> GetNotificationsByClassId(int classId);
        ClassNotificationFile CreateSubmissionFile(ClassNotificationFile file);
        ClassNotificationComment CreateComment(ClassNotificationComment comment);
        List<ClassNotificationComment> GetCommentsByNotificationId(int notificationId);
        List<ClassNotificationFile> GetFileByNotificationId(int notificationId);
        ClassNotificationComment CommentNoti(ClassNotificationComment comment);
        bool DeleteNotification(int id);

    }
}
