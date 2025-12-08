using StudyHub.Backend.Domain.Entities;
using System;
using System.Collections.Generic;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IClassNotificationRepository
    {
        List<ClassNotification> GetNotifications(int classId);
        ClassNotification CreateNotification(ClassNotification notification);
        ClassNotification EditNotification(ClassNotification notification);
        ClassNotification GetNotification(int notificationId);
        bool DeleteNotification(int notificationId);

        // Files & comments for notifications
        ClassNotificationFile CreateNotificationFile(ClassNotificationFile file);
        List<ClassNotificationFile> GetFilesByNotification(int notificationId);

        ClassNotificationComment CreateComment(ClassNotificationComment comment);
        List<ClassNotificationComment> GetCommentsByNotificationId(int notificationId);

        // Submissions for assignments (Notification.Type == 'classwork')
        NotificationSubmission SubmitNotification(NotificationSubmission submission, List<SubmissionFile> files);
        NotificationSubmission ResubmitNotification(int submissionId, List<SubmissionFile> files);
        NotificationSubmission GetSubmissionByUserAndNotification(int notificationId, Guid userId);
        List<NotificationSubmission> GetSubmissionsByNotificationId(int notificationId);
        bool DeleteNotificationFile(int classNotificationId);
        bool DeleteNotificationFileById(int classNotificationFileId);
        SubmissionFile AddSubmissionFile(SubmissionFile file);
        List<SubmissionFile> GetSubmissionFiles(int submissionId);

        int GetSubmissionCount(int notificationId);
        int GetMemberCountByNotification(int notificationId);
        int GetMemberClassCount(int classID);
        bool GradeSubmission(decimal score, int notificationSubmissionId, Guid gradeBy, string feedback);

        int GetTotalUnreadNotifications(int classID, Guid userID, string type);

        // NEW: danh sách thành viên lớp (để tạo group/broadcast)
        List<Guid> GetMemberIdsByClass(int classId);
    }
}