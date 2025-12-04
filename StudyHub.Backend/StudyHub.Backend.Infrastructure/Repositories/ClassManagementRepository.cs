using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class ClassManagementRepository : IClassManagementRepository
    {
        private readonly Data.AppDbContext _context;
        public ClassManagementRepository(Data.AppDbContext context)
        {
            _context = context;
        }



        public int GetTotalUsers() =>
            _context.AppUserClasses.AsNoTracking().Where(a => a.Status.Equals("joined")).GroupBy(a => a.UserId).Count();

        public int GetTotalClasses() =>
            _context.Classes.AsNoTracking().Count();

        public int GetTotalClassworkNotifications() =>
            _context.ClassNotifications.AsNoTracking().Count(n => n.Type == "classwork");

        public int GetTotalAnnouncementNotifications() =>
            _context.ClassNotifications.AsNoTracking().Count(n => n.Type == "notification");

        public List<sbyte> GetAllGrades() =>
            _context.Classes.AsNoTracking().Select(c => c.Grade).Distinct().OrderBy(g => g).ToList();

        public int GetClassCountByGrade(int grade) =>
            _context.Classes.AsNoTracking().Count(c => c.Grade == grade);

        public List<int> GetAllClassIds() =>
            _context.Classes.AsNoTracking().Select(c => c.Id).ToList();

        public int GetStudentsCountByClassId(int classId)
        {
            var classEntity = _context.AppUserClasses
               .Include(c => c.User)
               .Where(c => c.ClassId == classId && c.User.Roles.Any(r => r.Name.Contains("Student") && c.Status.Equals("joined")))
               .GroupBy(a => a.UserId)
               .ToList();

            return classEntity.Count();
        }

        public string GetClassNameById(int classId) =>
            _context.Classes.AsNoTracking().Where(c => c.Id == classId).Select(c => c.Name).FirstOrDefault() ?? string.Empty;

        public List<string> GetAllRoleNames() =>
            _context.AppRoles.AsNoTracking().Select(r => r.Name).ToList();

        public int GetRoleCountByName(string roleName)
        {
            try
            {
                // If AppRole.Users is a navigation collection of AppUser (or AppUserRole),
                // this will translate to SQL that counts the underlying user rows.
                var count = _context.AppRoles
                    .AsNoTracking()
                    .Where(r => r.Name == roleName)
                    .SelectMany(r => r.Users)   // flatten collections of users
                    .Select(u => u.Id)         // select user id to allow distinct
                    .Distinct()                // avoid duplicates if user has role multiple times
                    .Count();

                return count;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ClassManagementRepository", "GetRoleCountByName failed. Inner error: " + ex.Message).LogError();
                return 0;
            }
        }

        public int GetGenderCount(bool gender) =>
           _context.AppUsers.AsNoTracking().Count(u => u.Gender == gender);

        public int GetEmailVerifiedCount(bool isVerified) =>
            _context.AppUsers.AsNoTracking().Count(u => u.IsVerified == isVerified);

        public List<string> GetAnnouncementTypes() =>
            _context.ClassNotifications.AsNoTracking().Select(n => n.Type).Distinct().ToList();

        public int GetAnnouncementCountByType(string type) =>
            _context.ClassNotifications.AsNoTracking().Count(n => n.Type == type);

        public int GetTotalNotificationReadEntries() =>
            _context.ClassNotificationReadStatuses.AsNoTracking().Count();

        public int GetTotalNotificationReadReadEntries() =>
            _context.ClassNotificationReadStatuses.AsNoTracking().Count(r => r.IsRead == true);

        public int GetNotificationTotalByType(string type) =>
            (from rs in _context.ClassNotificationReadStatuses.AsNoTracking()
             join n in _context.ClassNotifications.AsNoTracking() on rs.NotificationId equals n.Id
             where n.Type == type
             select rs).Count();

        public int GetNotificationReadByType(string type) =>
            (from rs in _context.ClassNotificationReadStatuses.AsNoTracking()
             join n in _context.ClassNotifications.AsNoTracking() on rs.NotificationId equals n.Id
             where n.Type == type && rs.IsRead == true
             select rs).Count();

        public int GetNotificationsCountByClassId(int classId) =>
            _context.ClassNotifications.AsNoTracking().Count(n => n.ClassId == classId);

        public int GetSubmissionsCountByClassId(int classId) =>
            (from s in _context.NotificationSubmissions.AsNoTracking()
             join n in _context.ClassNotifications.AsNoTracking() on s.NotificationId equals n.Id
             where n.ClassId == classId
             select s).Count();

        public int GetCommentsCountByClassId(int classId) =>
            (from c in _context.ClassNotificationComments.AsNoTracking()
             join n in _context.ClassNotifications.AsNoTracking() on c.NotificationId equals n.Id
             where n.ClassId == classId
             select c).Count();

        public int GetJoinedCountByClassId(int classId) =>
            _context.AppUserClasses.AsNoTracking().Count(uc => uc.ClassId == classId && uc.Status == "joined");

        public List<double> GetAllGradedScores() =>
            _context.NotificationSubmissions.AsNoTracking()
                .Where(s => s.Score != null)
                .Select(s => (double)s.Score)
                .ToList();

        public List<int> GetNotificationIdsForClasswork() =>
            _context.ClassNotifications.AsNoTracking()
                .Where(n => n.Type == "classwork")
                .Select(n => n.Id)
                .ToList();

        public string GetNotificationTitle(int notificationId) =>
            _context.ClassNotifications.AsNoTracking()
                .Where(n => n.Id == notificationId)
                .Select(n => n.Title)
                .FirstOrDefault() ?? string.Empty;

        public int GetSubmissionsCountByNotificationId(int notificationId) =>
            _context.NotificationSubmissions.AsNoTracking().Count(s => s.NotificationId == notificationId);

        public List<string> GetDistinctClassworkMonths()
        {
            return _context.ClassNotifications.AsNoTracking()
                .Where(n => n.Type == "classwork" && n.CreatedAt != null)
                .Select(n => new { Year = n.CreatedAt.Year, Month = n.CreatedAt.Month })
                .AsEnumerable()
                .Select(x => $"{x.Year:D4}-{x.Month:D2}")
                .Distinct()
                .OrderBy(x => x)
                .ToList();
        }

        public int GetClassworkCountForYearMonth(int year, int month)
        {
            return _context.ClassNotifications.AsNoTracking()
                .Count(n => n.Type == "classwork" && n.CreatedAt.Year == year && n.CreatedAt.Month == month);
        }

        public List<string> GetDistinctNotificationMonths()
        {
            return _context.ClassNotifications.AsNoTracking()
                .Where(n => n.Type == "notification" && n.CreatedAt != null)
                .Select(n => new { Year = n.CreatedAt.Year, Month = n.CreatedAt.Month })
                .AsEnumerable()
                .Select(x => $"{x.Year:D4}-{x.Month:D2}")
                .Distinct()
                .OrderBy(x => x)
                .ToList();
        }

        public int GetNotificationCountForYearMonth(int year, int month)
        {
            return _context.ClassNotifications.AsNoTracking()
                .Count(n => n.Type == "notification" && n.CreatedAt.Year == year && n.CreatedAt.Month == month);
        }

        public List<string> GetDistinctSubmissionMonths()
        {
            return _context.NotificationSubmissions.AsNoTracking()
                .Where(s => s.LatestSubmissionTime != null)
                .Select(s => new { Year = s.LatestSubmissionTime.Year, Month = s.LatestSubmissionTime.Month })
                .AsEnumerable()
                .Select(x => $"{x.Year:D4}-{x.Month:D2}")
                .Distinct()
                .OrderBy(x => x)
                .ToList();
        }

        public int GetSubmissionCountForYearMonth(int year, int month)
        {
            return _context.NotificationSubmissions.AsNoTracking()
                .Count(s => s.LatestSubmissionTime.Year == year && s.LatestSubmissionTime.Month == month);
        }

        public List<string> GetDistinctClassCreatedMonths()
        {
            return _context.Classes.AsNoTracking()
                .Where(c => c.CreatedAt != null)
                .Select(c => new { Year = c.CreatedAt.Year, Month = c.CreatedAt.Month })
                .AsEnumerable()
                .Select(x => $"{x.Year:D4}-{x.Month:D2}")
                .Distinct()
                .OrderBy(x => x)
                .ToList();
        }

        public int GetClassCreatedCountForYearMonth(int year, int month)
        {
            return _context.Classes.AsNoTracking()
                .Count(c => c.CreatedAt.Year == year && c.CreatedAt.Month == month);
        }

        // CLASS-LEVEL helpers
        public int GetClassworksCountByClassId(int classId)
        {
            return _context.ClassNotifications.AsNoTracking()
                .Count(n => n.ClassId == classId && n.Type == "classwork");
        }

        public int GetTotalSubmissionsForClassId(int classId)
        {
            return (from s in _context.NotificationSubmissions.AsNoTracking()
                    join n in _context.ClassNotifications.AsNoTracking() on s.NotificationId equals n.Id
                    where n.ClassId == classId && n.Type == "classwork"
                    select s).Count();
        }

        public int GetTotalNotificationReadEntriesForClassId(int classId)
        {
            return (from rs in _context.ClassNotificationReadStatuses.AsNoTracking()
                    join n in _context.ClassNotifications.AsNoTracking() on rs.NotificationId equals n.Id
                    where n.ClassId == classId
                    select rs).Count();
        }

        public int GetReadCountForClassId(int classId)
        {
            return (from rs in _context.ClassNotificationReadStatuses.AsNoTracking()
                    join n in _context.ClassNotifications.AsNoTracking() on rs.NotificationId equals n.Id
                    where n.ClassId == classId && rs.IsRead == true
                    select rs).Count();
        }

        // NOTIFICATION-LEVEL helpers
        public List<int> GetAllNotificationIds()
        {
            return _context.ClassNotifications.AsNoTracking()
                .Select(n => n.Id)
                .ToList();
        }

        public int GetReadCountForNotification(int notificationId)
        {
            return _context.ClassNotificationReadStatuses.AsNoTracking()
                .Count(rs => rs.NotificationId == notificationId && rs.IsRead == true);
        }

        public int GetTotalRecipientsForNotification(int notificationId)
        {
            return _context.ClassNotificationReadStatuses.AsNoTracking()
                .Count(rs => rs.NotificationId == notificationId);
        }
    }
}