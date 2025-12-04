using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IClassManagementRepository
    {
        int GetTotalUsers();
        int GetTotalClasses();
        int GetTotalClassworkNotifications();
        int GetTotalAnnouncementNotifications();

        List<sbyte> GetAllGrades();
        int GetClassCountByGrade(int grade);

        List<int> GetAllClassIds();
        int GetStudentsCountByClassId(int classId);
        string GetClassNameById(int classId);

        List<string> GetAllRoleNames();
        int GetRoleCountByName(string roleName);

        int GetGenderCount(bool gender);
        int GetEmailVerifiedCount(bool isVerified);

        List<string> GetAnnouncementTypes();
        int GetAnnouncementCountByType(string type);

        int GetTotalNotificationReadEntries();
        int GetTotalNotificationReadReadEntries();

        int GetNotificationTotalByType(string type);
        int GetNotificationReadByType(string type);

        int GetNotificationsCountByClassId(int classId);
        int GetSubmissionsCountByClassId(int classId);
        int GetCommentsCountByClassId(int classId);

        int GetJoinedCountByClassId(int classId);

        List<double> GetAllGradedScores();

        List<int> GetNotificationIdsForClasswork();
        string GetNotificationTitle(int notificationId);
        int GetSubmissionsCountByNotificationId(int notificationId);
        List<string> GetDistinctClassworkMonths();
        int GetClassworkCountForYearMonth(int year, int month);

        List<string> GetDistinctNotificationMonths();
        int GetNotificationCountForYearMonth(int year, int month);

        List<string> GetDistinctSubmissionMonths();
        int GetSubmissionCountForYearMonth(int year, int month);

        List<string> GetDistinctClassCreatedMonths();
        int GetClassCreatedCountForYearMonth(int year, int month);

        // CLASS-LEVEL helpers (per-class single-value methods)
        int GetClassworksCountByClassId(int classId);
        int GetTotalSubmissionsForClassId(int classId);
        int GetTotalNotificationReadEntriesForClassId(int classId);
        int GetReadCountForClassId(int classId);

        // NOTIFICATION-LEVEL helpers (per-notification single-value methods)
        List<int> GetAllNotificationIds();
        int GetReadCountForNotification(int notificationId);
        int GetTotalRecipientsForNotification(int notificationId);
    }
}
