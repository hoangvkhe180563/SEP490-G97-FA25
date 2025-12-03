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

            // Use IEnumerable so we can reassign with .Take(...)
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

            // Use IEnumerable to allow .Take
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
    }
}