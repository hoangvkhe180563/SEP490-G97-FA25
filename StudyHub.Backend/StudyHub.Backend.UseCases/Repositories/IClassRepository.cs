using StudyHub.Backend.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IClassRepository
    {
        List<Class> GetAllClasses();
        List<Subject> GetAllSubject();
        List<AppUser> GetAllTeacher();
        List<Class> GetClassesByTeacherId(string teacherId);
        Class? GetClassById(int id);
        Class CreateClass(Class classEntity);
        Class UpdateClass(Class classEntity);
        bool DeleteClass(int id);
        Class? GetClassDetailById(int id);
        List<ClassMember> GetClassMembers(int classId);
        List<Class> GetClassByUserId(Guid userid);
        List<ClassNotification> GetClassNotifications(int classId);
        ClassNotification CreateNotification(ClassNotification notification);
        ClassNotification getNotificationByID(int notificationId);
        List<ClassNotification> GetNotificationsByClassId(int classId);
        ClassNotificationFile CreateSubmissionFile(ClassNotificationFile file);
        ClassNotificationComment CreateComment(ClassNotificationComment comment);
        List<ClassNotificationComment> GetCommentsByNotificationId(int notificationId);
        List<ClassNotificationFile> GetFileByNotificationId(int notificationId);
        ClassNotificationComment CommentNoti(ClassNotificationComment comment);
        bool deleteNotification(int id);
    }
}
