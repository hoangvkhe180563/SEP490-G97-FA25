using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.Domain.Entities;
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
        public List<Domain.Entities.Class> GetAllClasses()
        {
           
                return _context.Classes.Include(c => c.AppUserClasses).Where(c => c.DeletedAt == null).Select(c => new Domain.Entities.Class
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    Grade = c.Grade,
                    CreatedAt = c.CreatedAt,
                    CreatedBy = c.CreatedBy,
                    UpdatedAt = c.UpdatedAt,
                    UpdatedBy = c.UpdatedBy,
                    DeletedAt = c.DeletedAt
                }).OrderByDescending(c => c.CreatedAt).ToList();
            

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

        public List<int> GetClassIdsByGrade(int grade) =>
            _context.Classes.AsNoTracking().Where(c => c.Grade == grade).Select(c => c.Id).ToList();

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

        // CreatedBy is GUID now
        public Guid GetClassCreatedByUserId(int classId) =>
            _context.Classes.AsNoTracking().Where(c => c.Id == classId).Select(c => c.CreatedBy).FirstOrDefault();

        // userId parameter is Guid
        public int? GetUserSchoolId(Guid userId) =>
            _context.AppUsers.AsNoTracking().Where(u => u.Id == userId).Select(u => (int?)u.SchoolId).FirstOrDefault();

        public List<string> GetAllRoleNames() =>
            _context.AppRoles.AsNoTracking().Select(r => r.Name).ToList();

        public int GetRoleCountByName(string roleName)
        {
            try
            {
                var count = _context.AppRoles
                    .AsNoTracking()
                    .Where(r => r.Name == roleName)
                    .SelectMany(r => r.Users)
                    .Select(u => u.Id)
                    .Distinct()
                    .Count();

                return count;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ClassManagementRepository", "GetRoleCountByName failed. Inner error: " + ex.Message).LogError();
                return 0;
            }
        }

        public int GetRoleCountByNameAndSchool(string roleName, int schoolId)
        {
            try
            {
                var ids = _context.AppRoles
                    .AsNoTracking()
                    .Where(r => r.Name == roleName)
                    .SelectMany(r => r.Users)
                    .Select(u => u.Id)
                    .Distinct()
                    .ToList();

                return _context.AppUsers.AsNoTracking().Count(u => ids.Contains(u.Id) && u.SchoolId == schoolId);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ClassManagementRepository", "GetRoleCountByNameAndSchool failed. Inner error: " + ex.Message).LogError();
                return 0;
            }
        }

        public int GetGenderCount(bool gender) =>
           _context.AppUsers.AsNoTracking().Count(u => u.Gender == gender);

        public int GetGenderCountBySchool(bool gender, int schoolId) =>
            _context.AppUsers.AsNoTracking().Count(u => u.Gender == gender && u.SchoolId == schoolId);

        public int GetEmailVerifiedCount(bool isVerified) =>
            _context.AppUsers.AsNoTracking().Count(u => u.IsVerified == isVerified);

        public int GetEmailVerifiedCountBySchool(bool isVerified, int schoolId) =>
            _context.AppUsers.AsNoTracking().Count(u => u.IsVerified == isVerified && u.SchoolId == schoolId);

        public List<string> GetAnnouncementTypes() =>
            _context.ClassNotifications.AsNoTracking().Select(n => n.Type).Distinct().ToList();

        public int GetAnnouncementCountByType(string type) =>
            _context.ClassNotifications.AsNoTracking().Count(n => n.Type == type);

        public int GetAnnouncementCountByTypeByClass(string type, int classId) =>
            _context.ClassNotifications.AsNoTracking().Count(n => n.Type == type && n.ClassId == classId);

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

        public int GetNotificationTotalByTypeForClass(string type, int classId) =>
            (from rs in _context.ClassNotificationReadStatuses.AsNoTracking()
             join n in _context.ClassNotifications.AsNoTracking() on rs.NotificationId equals n.Id
             where n.Type == type && n.ClassId == classId
             select rs).Count();

        public int GetNotificationReadByTypeForClass(string type, int classId) =>
            (from rs in _context.ClassNotificationReadStatuses.AsNoTracking()
             join n in _context.ClassNotifications.AsNoTracking() on rs.NotificationId equals n.Id
             where n.Type == type && n.ClassId == classId && rs.IsRead == true
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

        public IEnumerable<double> GetAllGradedScoresByNotificationIds(IEnumerable<int> notificationIds) =>
            _context.NotificationSubmissions.AsNoTracking()
                .Where(s => s.Score != null && notificationIds.Contains(s.NotificationId))
                .Select(s => (double)s.Score)
                .AsEnumerable();

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

        public int GetClassIdForNotification(int notificationId) =>
            _context.ClassNotifications.AsNoTracking().Where(n => n.Id == notificationId).Select(n => n.ClassId).FirstOrDefault();

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

        public int GetClassworkCountForYearMonthByClass(int year, int month, int classId)
        {
            return _context.ClassNotifications.AsNoTracking()
                .Count(n => n.Type == "classwork" && n.ClassId == classId && n.CreatedAt.Year == year && n.CreatedAt.Month == month);
        }

        public int GetClassworkCountForClass(int classId) =>
            _context.ClassNotifications.AsNoTracking().Count(n => n.ClassId == classId && n.Type == "classwork");

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

        public int GetNotificationCountForYearMonthByClass(int year, int month, int classId)
        {
            return _context.ClassNotifications.AsNoTracking()
                .Count(n => n.Type == "notification" && n.ClassId == classId && n.CreatedAt.Year == year && n.CreatedAt.Month == month);
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

        public int GetSubmissionCountForYearMonthByClass(int year, int month, int classId)
        {
            return (from s in _context.NotificationSubmissions.AsNoTracking()
                    join n in _context.ClassNotifications.AsNoTracking() on s.NotificationId equals n.Id
                    where n.ClassId == classId && s.LatestSubmissionTime.Year == year && s.LatestSubmissionTime.Month == month
                    select s).Count();
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

        public int GetClassCreatedCountForYearMonthBySchool(int year, int month, int schoolId)
        {
            return (from c in _context.Classes.AsNoTracking()
                    join u in _context.AppUsers.AsNoTracking() on c.CreatedBy equals u.Id
                    where c.CreatedAt.Year == year && c.CreatedAt.Month == month && u.SchoolId == schoolId
                    select c).Count();
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

        // Return school's domain entity (unchanged)
        public Domain.Entities.School GetSchoolByID(int? schoolID)
        {
            var school = _context.Schools.FirstOrDefault(a => a.Id == schoolID);
            return new Domain.Entities.School
            {
                Id = school.Id,
                Name = school.Name,
                Address = school.Address,
                CommuneId = school.CommuneId,
            };
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

        // additional helper
        public int GetUserCountBySchoolId(int schoolId)
        {
            return _context.AppUsers.AsNoTracking().Count(u => u.SchoolId == schoolId);
        }
        public int GetAnnouncementCountForClass(int classId)
        {
            // "Announcement" ở code trước tương ứng với ClassNotification.Type == "notification"
            return _context.ClassNotifications
                           .AsNoTracking()
                           .Count(n => n.Type == "notification" && n.ClassId == classId);
        }

        // NEW: return the creator's display name for a notification (fallback to username)
        public string GetNotificationCreatedByName(int notificationId)
        {
            // Assume ClassNotifications.CreatedBy is a Guid referencing AppUsers.Id
            var userId = _context.ClassNotifications.AsNoTracking()
                .Where(n => n.Id == notificationId)
                .Select(n => n.CreatedBy)
                .FirstOrDefault();

            if (userId == Guid.Empty) return string.Empty;

            // Try to get a friendly display name; fallback to username or empty
            var name = _context.AppUsers.AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => u.Fullname)
                .FirstOrDefault();

            return name ?? string.Empty;
        }
    }
}