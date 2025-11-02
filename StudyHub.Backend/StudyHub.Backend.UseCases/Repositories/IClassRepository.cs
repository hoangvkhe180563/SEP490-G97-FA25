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
        List<Class> GetAllClasses(Guid? userid);
        List<Subject> GetAllSubject();
        List<AppUser> GetAllTeacher();
        List<Class> GetClassesByTeacherId(string teacherId);
        Class? GetClassById(int id);
        Class CreateClass(Class classEntity);
        Class UpdateClass(Class classEntity);
        Class? GetClassDetailById(int id);
        List<AppUserSubjectClass> GetClassMembers(int classId);
        List<Class> GetClassByUserId(Guid userid);
        List<Class> GetAllClassByUserId(Guid userid);

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
        bool InviteMember(Guid userId, int classId);
        bool ConfirmMember(Guid userId, int classId);
        bool KickMember(Guid userId, int classId);
        List<Classwork> GetClassworks(int classId);
        Classwork CreateClasswork(Classwork classwork);
         Classwork EditClasswork(Classwork classwork);
        ClassworkSubmission SubmitClasswork(ClassworkSubmission submission, List<SubmissionFile> files);
        ClassworkSubmission ResubmitClasswork(int submissionId, List<SubmissionFile> files);
        Classwork GetClasswork(int classworkId);
        List<ClassworkSubmission> GetSubmissionsByClassworkId(int classworkId);
        ClassworkSubmission GetSubmissionByUserAndClasswork(int classworkId, Guid userId);
        SubmissionFile AddSubmissionFile(SubmissionFile file);
        List<SubmissionFile> GetSubmissionFiles(int submissionId);
        int GetSubmissionCount(int classworkId);
        int GetMemberCount(int classworkId);
        int GetMemberClassCount(int classID);
    }
}
