using System;
using System.Collections.Generic;
using System.Linq;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class ClassManagementService
    {
        private readonly IClassManagementRepository _repo;

        public ClassManagementService(IClassManagementRepository repo)
        {
            _repo = repo;
        }

        // Overview as tuple of primitives
        public (int TotalUsers, int TotalClasses, int TotalAssignments, int TotalAnnouncements) GetOverviewPrimitives()
        {
            var totalUsers = _repo.GetTotalUsers();
            var totalClasses = _repo.GetTotalClasses();
            var totalAssignments = _repo.GetTotalClassworkNotifications();
            var totalAnnouncements = _repo.GetTotalAnnouncementNotifications();
            return (totalUsers, totalClasses, totalAssignments, totalAnnouncements);
        }

        // Classes by grade: returns list of (grade, count)
        public IReadOnlyList<(int Grade, int Count)> GetClassesByGradePrimitives()
        {
            var grades = _repo.GetAllGrades();
            var list = new List<(int Grade, int Count)>();
            foreach (var g in grades)
            {
                var cnt = _repo.GetClassCountByGrade(g);
                list.Add((g, cnt));
            }
            return list.OrderBy(x => x.Grade).ToList();
        }

        // Students per class: returns list of (classId, className, students)
        public IReadOnlyList<(int ClassId, string ClassName, int Students)> GetStudentsPerClassPrimitives(int? limit = null)
        {
            var classIds = _repo.GetAllClassIds();
            var results = new List<(int ClassId, string ClassName, int Students)>();
            foreach (var id in classIds)
            {
                var students = _repo.GetStudentsCountByClassId(id);
                var name = _repo.GetClassNameById(id) ?? string.Empty;
                results.Add((id, name, students));
            }

            IEnumerable<(int ClassId, string ClassName, int Students)> ordered = results.OrderByDescending(r => r.Students);
            if (limit.HasValue && limit.Value > 0)
                ordered = ordered.Take(limit.Value);

            return ordered.ToList();
        }

        // Role counts: returns list of (roleName, count)
        public IReadOnlyList<(string RoleName, int Count)> GetRoleCountsPrimitives()
        {
            var roleNames = _repo.GetAllRoleNames();
            var list = new List<(string RoleName, int Count)>();
            foreach (var role in roleNames)
            {
                var cnt = _repo.GetRoleCountByName(role);
                list.Add((role, cnt));
            }
            return list;
        }

        // Gender ratio: returns (maleCount, femaleCount)
        public (int Male, int Female) GetGenderRatioPrimitives()
        {
            var male = _repo.GetGenderCount(true);
            var female = _repo.GetGenderCount(false);
            return (male, female);
        }

        // Email verification counts: (verified, unverified)
        public (int Verified, int Unverified) GetEmailVerifiedPrimitives()
        {
            var verified = _repo.GetEmailVerifiedCount(true);
            var unverified = _repo.GetEmailVerifiedCount(false);
            return (verified, unverified);
        }

        // Announcements by type: list of (type, count)
        public IReadOnlyList<(string Type, int Count)> GetAnnouncementsByTypePrimitives()
        {
            var types = _repo.GetAnnouncementTypes();
            var list = new List<(string Type, int Count)>();
            foreach (var t in types)
            {
                var cnt = _repo.GetAnnouncementCountByType(t);
                list.Add((t, cnt));
            }
            return list;
        }

        // Read rates: overall percent and per-type percent as list of (key, percent)
        public IReadOnlyList<(string Key, double Percent)> GetReadRatesPrimitives()
        {
            var total = _repo.GetTotalNotificationReadEntries();
            var read = _repo.GetTotalNotificationReadReadEntries();
            double overallPct = total == 0 ? 0.0 : ((double)read / total) * 100.0;

            var types = _repo.GetAnnouncementTypes();
            var list = new List<(string Key, double Percent)> { ("Overall", Math.Round(overallPct, 2)) };

            foreach (var t in types)
            {
                var tot = _repo.GetNotificationTotalByType(t);
                var rd = _repo.GetNotificationReadByType(t);
                var pct = tot == 0 ? 0.0 : ((double)rd / tot) * 100.0;
                list.Add((t, Math.Round(pct, 2)));
            }

            return list;
        }

        // Top active classes: returns list of (classId, className, activityScore, notifications, submissions, comments)
        public IReadOnlyList<(int ClassId, string ClassName, double ActivityScore, int NotificationsCount, int SubmissionsCount, int CommentsCount)> GetTopActiveClassesPrimitives(int top = 10)
        {
            var classIds = _repo.GetAllClassIds();
            var list = new List<(int, string, double, int, int, int)>();

            foreach (var cid in classIds)
            {
                var notifs = _repo.GetNotificationsCountByClassId(cid);
                var subs = _repo.GetSubmissionsCountByClassId(cid);
                var comms = _repo.GetCommentsCountByClassId(cid);
                double score = notifs * 1.0 + subs * 2.0 + comms * 0.5;
                var name = _repo.GetClassNameById(cid) ?? string.Empty;

                list.Add((cid, name, score, notifs, subs, comms));
            }

            IEnumerable<(int, string, double, int, int, int)> ordered = list.OrderByDescending(x => x.Item3);
            return ordered.Take(top).ToList();
        }

        // Submission rate: returns fraction (0..1)
        public double GetSubmissionRatePrimitives()
        {
            var notifIds = _repo.GetNotificationIdsForClasswork();
            if (!notifIds.Any()) return 0.0;

            long expected = 0;
            var classIds = _repo.GetAllClassIds();
            foreach (var id in classIds)
            {
                var joined = _repo.GetJoinedCountByClassId(id);
                expected += joined;
            }

            var actual = 0;
            foreach (var nid in notifIds)
            {
                actual += _repo.GetSubmissionsCountByNotificationId(nid);
            }

            if (expected == 0) return 0.0;
            return Math.Round((double)actual / expected, 4);
        }

        // Score distribution: returns list of (range, count, pct)
        public IReadOnlyList<(string Range, int Count, double Pct)> GetScoreDistributionPrimitives()
        {
            var scores = _repo.GetAllGradedScores();
            var c90 = scores.Count(s => s >= 90);
            var c80 = scores.Count(s => s >= 80 && s < 90);
            var c70 = scores.Count(s => s >= 70 && s < 80);
            var c0 = scores.Count(s => s < 70);
            var total = scores.Count;

            var list = new List<(string, int, double)>
            {
                ("90-100", c90, total == 0 ? 0.0 : Math.Round((double)c90 / total, 4)),
                ("80-89", c80, total == 0 ? 0.0 : Math.Round((double)c80 / total, 4)),
                ("70-79", c70, total == 0 ? 0.0 : Math.Round((double)c70 / total, 4)),
                ("0-69", c0, total == 0 ? 0.0 : Math.Round((double)c0 / total, 4))
            };

            return list;
        }

        // Most interactive assignments: returns list of (notificationId, title, submissionsCount)
        public IReadOnlyList<(int NotificationId, string Title, int SubmissionsCount)> GetMostInteractiveAssignmentsPrimitives(int top = 10)
        {
            var ids = _repo.GetNotificationIdsForClasswork();
            var list = new List<(int, string, int)>();
            foreach (var id in ids)
            {
                var title = _repo.GetNotificationTitle(id) ?? string.Empty;
                var subs = _repo.GetSubmissionsCountByNotificationId(id);
                list.Add((id, title, subs));
            }

            IEnumerable<(int, string, int)> ordered = list.OrderByDescending(x => x.Item3);
            return ordered.Take(top).ToList();
        }

        // --------------------------------------------------------------------
        // Monthly aggregates (build series using small repo primitives)
        // --------------------------------------------------------------------

        public IReadOnlyList<(string Month, int Count)> GetClassworksByMonthPrimitives(int months = 12)
        {
            var series = GenerateLastNMonths(months);
            var result = new List<(string Month, int Count)>(series.Count);

            foreach (var (y, m, ym) in series)
            {
                try
                {
                    var cnt = _repo.GetClassworkCountForYearMonth(y, m);
                    result.Add((ym, cnt));
                }
                catch
                {
                    // on error treat missing as zero to keep chart stable
                    result.Add((ym, 0));
                }
            }

            return result;
        }

        public IReadOnlyList<(string Month, int Count)> GetNotificationsByMonthPrimitives(int months = 12)
        {
            var series = GenerateLastNMonths(months);
            var result = new List<(string Month, int Count)>(series.Count);

            foreach (var (y, m, ym) in series)
            {
                try
                {
                    var cnt = _repo.GetNotificationCountForYearMonth(y, m);
                    result.Add((ym, cnt));
                }
                catch
                {
                    result.Add((ym, 0));
                }
            }

            return result;
        }

        public IReadOnlyList<(string Month, int Count)> GetSubmissionsByMonthPrimitives(int months = 12)
        {
            var series = GenerateLastNMonths(months);
            var result = new List<(string Month, int Count)>(series.Count);

            foreach (var (y, m, ym) in series)
            {
                try
                {
                    var cnt = _repo.GetSubmissionCountForYearMonth(y, m);
                    result.Add((ym, cnt));
                }
                catch
                {
                    result.Add((ym, 0));
                }
            }

            return result;
        }

        public IReadOnlyList<(string Month, int Count)> GetNewClassesByMonthPrimitives(int months = 12)
        {
            var series = GenerateLastNMonths(months);
            var result = new List<(string Month, int Count)>(series.Count);

            foreach (var (y, m, ym) in series)
            {
                try
                {
                    var cnt = _repo.GetClassCreatedCountForYearMonth(y, m);
                    result.Add((ym, cnt));
                }
                catch
                {
                    result.Add((ym, 0));
                }
            }

            return result;
        }

        // --------------------------------------------------------------------
        // Helper: generate a list of last N months (year, month, "YYYY-MM"), ordered ascending
        // --------------------------------------------------------------------
        private List<(int Year, int Month, string Ym)> GenerateLastNMonths(int n)
        {
            if (n <= 0) n = 12;
            var now = DateTime.UtcNow;
            var list = new List<(int, int, string)>(n);
            // produce ascending order from oldest -> newest
            for (int i = n - 1; i >= 0; i--)
            {
                var dt = now.AddMonths(-i);
                list.Add((dt.Year, dt.Month, $"{dt.Year:D4}-{dt.Month:D2}"));
            }
            return list;
        }

        // --------------------------------------------------------------------
        // Class-level aggregated stats (service-level logic)
        // --------------------------------------------------------------------
        public IReadOnlyList<(int ClassId, string ClassName, int StudentsCount, double SubmissionRate, double ReadRate, int ClassworksCount, int NotificationsCount, int TotalSubmissions)> GetClassStatsPrimitives()
        {
            var classIds = _repo.GetAllClassIds();
            var list = new List<(int, string, int, double, double, int, int, int)>();

            foreach (var cid in classIds)
            {
                var name = _repo.GetClassNameById(cid) ?? string.Empty;
                var students = _repo.GetJoinedCountByClassId(cid);

                var classworksCount = _repo.GetClassworksCountByClassId(cid);
                var totalSubmissions = _repo.GetTotalSubmissionsForClassId(cid);

                long expected = (long)students * classworksCount;
                double submissionRate = expected == 0 ? 0.0 : Math.Round((double)totalSubmissions / expected, 4);

                var totalReadEntries = _repo.GetTotalNotificationReadEntriesForClassId(cid);
                var readCount = _repo.GetReadCountForClassId(cid);
                double readRate = totalReadEntries == 0 ? 0.0 : Math.Round((double)readCount / totalReadEntries, 4);

                var notificationsCount = _repo.GetNotificationsCountByClassId(cid);

                list.Add((cid, name, students, submissionRate, readRate, classworksCount, notificationsCount, totalSubmissions));
            }

            return list;
        }

        // --------------------------------------------------------------------
        // Notification-level stats: top read and most ignored (service-level logic)
        // --------------------------------------------------------------------
        public IReadOnlyList<(int NotificationId, string Title, int ReadsCount, int IgnoredCount, int TotalRecipients, int SubmissionsCount)> GetTopReadNotificationsPrimitives(int top = 10)
        {
            var notifIds = _repo.GetAllNotificationIds() ?? new List<int>();
            var result = new List<(int, string, int, int, int, int)>();

            foreach (var id in notifIds)
            {
                var reads = _repo.GetReadCountForNotification(id);
                var total = _repo.GetTotalRecipientsForNotification(id);
                var subs = _repo.GetSubmissionsCountByNotificationId(id);
                var title = _repo.GetNotificationTitle(id) ?? string.Empty;
                var ignored = Math.Max(0, total - reads);
                result.Add((id, title, reads, ignored, total, subs));
            }

            return result.OrderByDescending(x => x.Item3).ThenByDescending(x => x.Item6).Take(top).ToList();
        }

        public IReadOnlyList<(int NotificationId, string Title, int ReadsCount, int IgnoredCount, int TotalRecipients, int SubmissionsCount)> GetMostIgnoredNotificationsPrimitives(int top = 10)
        {
            var notifIds = _repo.GetAllNotificationIds() ?? new List<int>();
            var result = new List<(int, string, int, int, int, int)>();

            foreach (var id in notifIds)
            {
                var reads = _repo.GetReadCountForNotification(id);
                var total = _repo.GetTotalRecipientsForNotification(id);
                var subs = _repo.GetSubmissionsCountByNotificationId(id);
                var title = _repo.GetNotificationTitle(id) ?? string.Empty;
                var ignored = Math.Max(0, total - reads);
                result.Add((id, title, reads, ignored, total, subs));
            }

            return result.OrderByDescending(x => x.Item4).ThenByDescending(x => x.Item6).Take(top).ToList();
        }

        // --------------------------------------------------------------------
        // Class with most notifications (service-level logic)
        // --------------------------------------------------------------------
        public (int? ClassId, string ClassName, int NotificationsCount, int SubmissionsCount, int CommentsCount)? GetClassWithMostNotificationsPrimitives()
        {
            var classIds = _repo.GetAllClassIds() ?? new List<int>();
            if (!classIds.Any()) return null;

            int bestCid = -1;
            int bestCount = -1;
            foreach (var cid in classIds)
            {
                var cnt = _repo.GetNotificationsCountByClassId(cid);
                if (cnt > bestCount)
                {
                    bestCount = cnt;
                    bestCid = cid;
                }
            }

            if (bestCid == -1) return null;

            var name = _repo.GetClassNameById(bestCid) ?? string.Empty;
            var subs = _repo.GetSubmissionsCountByClassId(bestCid);
            var comms = _repo.GetCommentsCountByClassId(bestCid);

            return (bestCid, name, bestCount, subs, comms);
        }

        // --------------------------------------------------------------------
        // helpers
        // --------------------------------------------------------------------
        private bool TryParseYearMonth(string ym, out int year, out int month)
        {
            year = 0;
            month = 0;
            if (string.IsNullOrWhiteSpace(ym)) return false;
            // expected format "YYYY-MM"
            var parts = ym.Split('-', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 2) return false;
            if (!int.TryParse(parts[0], out year)) return false;
            if (!int.TryParse(parts[1], out month)) return false;
            return year >= 1 && month >= 1 && month <= 12;
        }
    }
}