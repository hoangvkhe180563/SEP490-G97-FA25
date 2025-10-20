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
        List<ClassNotification> GetClassNotifications(int classId);
        ClassNotification CreateNotification(ClassNotification notification);
        List<ClassNotification> GetNotificationsByClassId(int classId);

        ClassNotificationComment CreateComment(ClassNotificationComment comment);
        List<ClassNotificationComment> GetCommentsByNotificationId(int notificationId);

        NotificationFile CreateSubmissionFile(NotificationFile file);
        void MapFileToNotification(int notificationId, int fileId);
        List<SubmissionFile> GetFilesByNotificationId(int notificationId);
    }
}
