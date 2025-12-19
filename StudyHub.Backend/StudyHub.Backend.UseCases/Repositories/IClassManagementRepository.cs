using StudyHub.Backend.Domain.Entities;
using System;
using System.Collections.Generic;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IClassManagementRepository
    {
        List<Domain.Entities.Class> GetAllClasses();
        int GetTotalUsers();
        int GetTotalClasses();
        int GetTotalClassworkNotifications();
        int GetTotalAnnouncementNotifications();

        List<sbyte> GetAllGrades();
        int GetClassCountByGrade(int grade);
        List<int> GetClassIdsByGrade(int grade); // added

        List<int> GetAllClassIds();
        int GetStudentsCountByClassId(int classId);
        string GetClassNameById(int classId);

        // NOTE: user ids and createdBy are GUIDs now
        Guid GetClassCreatedByUserId(int classId); // changed to Guid
        int? GetUserSchoolId(Guid userId); // changed parameter to Guid, still returns int? for schoolId

        List<string> GetAllRoleNames();
        int GetRoleCountByName(string roleName);
        int GetRoleCountByNameAndSchool(string roleName, int schoolId); // added

        int GetGenderCount(bool gender);
        int GetGenderCountBySchool(bool gender, int schoolId); // added
        int GetEmailVerifiedCount(bool isVerified);
        int GetEmailVerifiedCountBySchool(bool isVerified, int schoolId); // added

        List<string> GetAnnouncementTypes();
        int GetAnnouncementCountByType(string type);
        int GetAnnouncementCountByTypeByClass(string type, int classId); // added

        int GetTotalNotificationReadEntries();
        int GetTotalNotificationReadReadEntries();

        int GetNotificationTotalByType(string type);
        int GetNotificationReadByType(string type);
        int GetNotificationTotalByTypeForClass(string type, int classId); // added
        int GetNotificationReadByTypeForClass(string type, int classId); // added

        int GetNotificationsCountByClassId(int classId);
        int GetSubmissionsCountByClassId(int classId);
        int GetCommentsCountByClassId(int classId);

        int GetJoinedCountByClassId(int classId);

        List<double> GetAllGradedScores();
        IEnumerable<double> GetAllGradedScoresByNotificationIds(IEnumerable<int> notificationIds); // added

        List<int> GetNotificationIdsForClasswork();
        string GetNotificationTitle(int notificationId);
        int GetSubmissionsCountByNotificationId(int notificationId);
        int GetClassIdForNotification(int notificationId); // added

        List<string> GetDistinctClassworkMonths();
        int GetClassworkCountForYearMonth(int year, int month);
        int GetClassworkCountForYearMonthByClass(int year, int month, int classId); // added
        int GetClassworkCountForClass(int classId); // added

        List<string> GetDistinctNotificationMonths();
        int GetNotificationCountForYearMonth(int year, int month);
        int GetNotificationCountForYearMonthByClass(int year, int month, int classId); // added
        int GetAnnouncementCountForClass(int classId); // added

        List<string> GetDistinctSubmissionMonths();
        int GetSubmissionCountForYearMonth(int year, int month);
        int GetSubmissionCountForYearMonthByClass(int year, int month, int classId); // added

        List<string> GetDistinctClassCreatedMonths();
        int GetClassCreatedCountForYearMonth(int year, int month);
        int GetClassCreatedCountForYearMonthBySchool(int year, int month, int schoolId); // added

        // CLASS-LEVEL helpers (per-class single-value methods)
        int GetClassworksCountByClassId(int classId);
        int GetTotalSubmissionsForClassId(int classId);
        int GetTotalNotificationReadEntriesForClassId(int classId);
        int GetReadCountForClassId(int classId);
        School GetSchoolByID(int? schoolID);
        // NOTIFICATION-LEVEL helpers (per-notification single-value methods)
        List<int> GetAllNotificationIds();
        int GetReadCountForNotification(int notificationId);
        int GetTotalRecipientsForNotification(int notificationId);

        // NEW: return the creator's display name for a notification (fallback to username)
        string GetNotificationCreatedByName(int notificationId);

        // Additional helper used above
        int GetUserCountBySchoolId(int schoolId); // added

        // NEW: number of comments for a notification (used for "interaction" metric)
        int GetCommentsCountByNotificationId(int notificationId); // added

        // NEW: list of notification ids for a given type
        List<int> GetNotificationIdsByType(string type); // added

        // NEW: average score per class (AvgScore, Count of scored submissions)
        List<(int ClassId, double AvgScore, int Count)> GetAverageScorePerClass(); // added
    }
}