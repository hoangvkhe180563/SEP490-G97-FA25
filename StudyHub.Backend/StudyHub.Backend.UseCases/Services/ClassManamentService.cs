using Elastic.Clients.Elasticsearch.Security;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;

namespace StudyHub.Backend.UseCases.Services
{
    public class ClassManagementService
    {
        private readonly IClassManagementRepository _repo;
        private readonly IAppUserRepository _userRepo;

        public ClassManagementService(IClassManagementRepository repo, IAppUserRepository userRepo)
        {
            _repo = repo;
            _userRepo = userRepo;
        }

        // helper: whether a class belongs to a schoolId (based on CreatedBy -> user's SchoolId)
        private bool ClassBelongsToSchool(int classId, int schoolId)
        {
            var createdBy = _repo.GetClassCreatedByUserId(classId);
            if (createdBy == null) return false;
            var userSchool = _repo.GetUserSchoolId(createdBy);
            return userSchool.HasValue && userSchool.Value == schoolId;
        }
        public School GetSchool(Guid userGuid)
        {


            var appUser = _userRepo.GetById(userGuid);
            if (appUser == null)
                return null;
            if (appUser.SchoolId == null)
            {
                return null;
            }
            var school = _repo.GetSchoolByID(appUser.SchoolId);
            return school;
        }
        public (List<Class> Classes, int TotalItems, int Page, int Limit, int TotalPages) GetClassesPaged(string? query, string? status, Guid memberid, int page = 1, int limit = 10)
        {
            var appUser = _userRepo.GetById(memberid);
            
            var allClasses = GetAllClassBySchooldID(appUser.SchoolId);

            var filtered = allClasses
                .Where(c => (string.IsNullOrEmpty(query) || c.Name.Contains(query, StringComparison.OrdinalIgnoreCase)) && c.DeletedAt == null)
                .ToList();

            int totalItems = filtered.Count;
            int totalPages = (int)Math.Ceiling((double)totalItems / Math.Max(1, limit));
            page = Math.Max(1, Math.Min(page, Math.Max(1, totalPages)));

            var paged = filtered.Skip((page - 1) * limit).Take(limit).ToList();

            return (paged, totalItems, page, limit, totalPages);
        }
        public List<Class> GetAllClassBySchooldID(int? schoolID)
        {
            var classes = _repo.GetAllClasses();
            List<Class> result = new List<Class>();
            foreach (var clazz in classes)
            {
                if (_userRepo.GetById(clazz.CreatedBy)!=null&&_userRepo.GetById(clazz.CreatedBy).SchoolId == schoolID)
                {
                    result.Add(clazz);
                }
            }
            return result;
        }
        // Overview as tuple of primitives (optional schoolId)
        public (int TotalUsers, int TotalClasses, int TotalAssignments, int TotalAnnouncements) GetOverviewPrimitives(int? schoolId = null)
        {
            if (!schoolId.HasValue)
            {
                var totalUsers = _repo.GetTotalUsers();
                var totalClasses = _repo.GetTotalClasses();
                var totalAssignments = _repo.GetTotalClassworkNotifications();
                var totalAnnouncements = _repo.GetTotalAnnouncementNotifications();
                return (totalUsers, totalClasses, totalAssignments, totalAnnouncements);
            }

            // school-scoped counts: users with that school, classes created by users from that school, notifications for those classes
            var usersInSchool = _repo.GetUserCountBySchoolId(schoolId.Value);
            var allClassIds = _repo.GetAllClassIds();
            var classesForSchool = allClassIds.Where(cid => ClassBelongsToSchool(cid, schoolId.Value)).ToList();
            var classesCount = classesForSchool.Count;

            var assignments = 0;
            var announcements = 0;
            foreach (var cid in classesForSchool)
            {
                assignments += _repo.GetClassworkCountForClass(cid);
                announcements += _repo.GetAnnouncementCountForClass(cid);
            }

            return (usersInSchool, classesCount, assignments, announcements);
        }

        // Classes by grade: optional schoolId
        public IReadOnlyList<(int Grade, int Count)> GetClassesByGradePrimitives(int? schoolId = null)
        {
            var grades = _repo.GetAllGrades();
            var list = new List<(int Grade, int Count)>();
            foreach (var g in grades)
            {
                if (!schoolId.HasValue)
                {
                    var cnt = _repo.GetClassCountByGrade(g);
                    list.Add((g, cnt));
                }
                else
                {
                    // count classes with grade==g AND class belongs to school
                    var ids = _repo.GetClassIdsByGrade(g);
                    int cnt = ids.Count(cid => ClassBelongsToSchool(cid, schoolId.Value));
                    list.Add((g, cnt));
                }
            }
            return list.OrderBy(x => x.Grade).ToList();
        }

        // Students per class: optional schoolId, optional limit
        public IReadOnlyList<(int ClassId, string ClassName, int Students)> GetStudentsPerClassPrimitives(int? limit = null, int? schoolId = null)
        {
            var classIds = _repo.GetAllClassIds();
            if (schoolId.HasValue)
                classIds = classIds.Where(cid => ClassBelongsToSchool(cid, schoolId.Value)).ToList();

            var results = new List<(int ClassId, string ClassName, int Students)>();
            foreach (var id in classIds)
            {
                var students = _repo.GetStudentsCountByClassId(id);
                var name = _repo.GetClassNameById(id) ?? string.Empty;
                results.Add((id, name, students));
            }

            IEnumerable<(int, string, int)> ordered = results.OrderByDescending(r => r.Students);
            if (limit.HasValue && limit.Value > 0)
                ordered = ordered.Take(limit.Value);

            return ordered.ToList();
        }

        // Role counts - optional filter by school (count users in role who have SchoolId)
        public IReadOnlyList<(string RoleName, int Count)> GetRoleCountsPrimitives(int? schoolId = null)
        {
            var roleNames = _repo.GetAllRoleNames();
            var list = new List<(string RoleName, int Count)>();
            foreach (var role in roleNames)
            {
                int cnt = schoolId.HasValue ? _repo.GetRoleCountByNameAndSchool(role, schoolId.Value) : _repo.GetRoleCountByName(role);
                list.Add((role, cnt));
            }
            return list;
        }

        // Gender ratio: optional schoolId
        public (int Male, int Female) GetGenderRatioPrimitives(int? schoolId = null)
        {
            if (!schoolId.HasValue)
            {
                var male = _repo.GetGenderCount(true);
                var female = _repo.GetGenderCount(false);
                return (male, female);
            }
            var maleS = _repo.GetGenderCountBySchool(true, schoolId.Value);
            var femaleS = _repo.GetGenderCountBySchool(false, schoolId.Value);
            return (maleS, femaleS);
        }

        // Email verification counts: optional schoolId
        public (int Verified, int Unverified) GetEmailVerifiedPrimitives(int? schoolId = null)
        {
            if (!schoolId.HasValue)
                return (_repo.GetEmailVerifiedCount(true), _repo.GetEmailVerifiedCount(false));

            return (_repo.GetEmailVerifiedCountBySchool(true, schoolId.Value), _repo.GetEmailVerifiedCountBySchool(false, schoolId.Value));
        }

        // Announcements by type: optional schoolId
        public IReadOnlyList<(string Type, int Count)> GetAnnouncementsByTypePrimitives(int? schoolId = null)
        {
            var types = _repo.GetAnnouncementTypes();
            var list = new List<(string Type, int Count)>();
            foreach (var t in types)
            {
                int cnt = 0;
                if (!schoolId.HasValue)
                    cnt = _repo.GetAnnouncementCountByType(t);
                else
                {
                    // sum per class in school
                    var classIds = _repo.GetAllClassIds().Where(cid => ClassBelongsToSchool(cid, schoolId.Value));
                    foreach (var cid in classIds) cnt += _repo.GetAnnouncementCountByTypeByClass(t, cid);
                }
                list.Add((t, cnt));
            }
            return list;
        }

        // Read rates: optional schoolId
        public IReadOnlyList<(string Key, double Percent)> GetReadRatesPrimitives(int? schoolId = null)
        {
            if (!schoolId.HasValue) return GetReadRatesPrimitivesRaw();
            // compute for classes in school
            var types = _repo.GetAnnouncementTypes();
            var list = new List<(string Key, double Percent)>();
            long total = 0;
            long read = 0;
            var classIds = _repo.GetAllClassIds().Where(cid => ClassBelongsToSchool(cid, schoolId.Value));
            // overall: sum rs for notifications that belong to those classes
            foreach (var cid in classIds)
            {
                total += _repo.GetTotalNotificationReadEntriesForClassId(cid);
                read += _repo.GetReadCountForClassId(cid);
            }
            double overallPct = total == 0 ? 0.0 : ((double)read / total) * 100.0;
            list.Add(("Overall", Math.Round(overallPct, 2)));
            foreach (var t in types)
            {
                long tot = 0;
                long rd = 0;
                foreach (var cid in classIds)
                {
                    tot += _repo.GetNotificationTotalByTypeForClass(t, cid);
                    rd += _repo.GetNotificationReadByTypeForClass(t, cid);
                }
                var pct = tot == 0 ? 0.0 : ((double)rd / tot) * 100.0;
                list.Add((t, Math.Round(pct, 2)));
            }
            return list;
        }

        // fallback read rates (existing logic)
        private IReadOnlyList<(string Key, double Percent)> GetReadRatesPrimitivesRaw()
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

        // Top active classes: optional schoolId
        public IReadOnlyList<(int ClassId, string ClassName, double ActivityScore, int NotificationsCount, int SubmissionsCount, int CommentsCount)> GetTopActiveClassesPrimitives(int top = 10, int? schoolId = null)
        {
            var classIds = _repo.GetAllClassIds();
            if (schoolId.HasValue)
                classIds = classIds.Where(cid => ClassBelongsToSchool(cid, schoolId.Value)).ToList();

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

            return list.OrderByDescending(x => x.Item3).Take(top).ToList();
        }

        // Submission rate: optional schoolId
        public double GetSubmissionRatePrimitives(int? schoolId = null)
        {
            var notifIds = _repo.GetNotificationIdsForClasswork();
            if (!notifIds.Any()) return 0.0;
            long expected = 0;
            var classIds = _repo.GetAllClassIds();
            if (schoolId.HasValue)
                classIds = classIds.Where(cid => ClassBelongsToSchool(cid, schoolId.Value)).ToList();

            foreach (var id in classIds)
            {
                var joined = _repo.GetJoinedCountByClassId(id);
                expected += joined;
            }

            var actual = 0;
            foreach (var nid in notifIds)
            {
                // if schoolId filter, only count submissions for notifications whose class belongs to the school
                var notifClassId = _repo.GetClassIdForNotification(nid);
                if (schoolId.HasValue && !ClassBelongsToSchool(notifClassId, schoolId.Value)) continue;
                actual += _repo.GetSubmissionsCountByNotificationId(nid);
            }

            if (expected == 0) return 0.0;
            return Math.Round((double)actual / expected, 4);
        }

        // Score distribution optional schoolId
        public IReadOnlyList<(string Range, int Count, double Pct)> GetScoreDistributionPrimitives(int? schoolId = null)
        {
            var scores = _repo.GetAllGradedScores();
            if (schoolId.HasValue)
            {
                // filter submissions by notification's class belonging to school
                var notifIds = _repo.GetAllNotificationIds();
                var allowedNotifIds = notifIds.Where(nid =>
                {
                    var cid = _repo.GetClassIdForNotification(nid);
                    return ClassBelongsToSchool(cid, schoolId.Value);
                }).ToHashSet();

                scores = _repo.GetAllGradedScoresByNotificationIds(allowedNotifIds).ToList();
            }

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

        // Most interactive assignments with optional schoolId
        public IReadOnlyList<(int NotificationId,string CreateBy, string Title, int SubmissionsCount)> GetMostInteractiveAssignmentsPrimitives(int top = 10, int? schoolId = null)
        {
            var ids = _repo.GetNotificationIdsForClasswork();
            var list = new List<(int,string, string, int)>();
            foreach (var id in ids)
            {
                var notifClassId = _repo.GetClassIdForNotification(id);
                if (schoolId.HasValue && !ClassBelongsToSchool(notifClassId, schoolId.Value)) continue;
                var creatorName = _repo.GetNotificationCreatedByName(id) ?? string.Empty;

                var title = _repo.GetNotificationTitle(id) ?? string.Empty;
                var subs = _repo.GetSubmissionsCountByNotificationId(id);
                list.Add((id, creatorName, title, subs));
            }

            return list.OrderByDescending(x => x.Item3).Take(top).ToList();
        }

        // Monthly aggregates with optional schoolId
        public IReadOnlyList<(string Month, int Count)> GetClassworksByMonthPrimitives(int months = 12, int? schoolId = null)
        {
            var series = GenerateLastNMonths(months);
            var result = new List<(string Month, int Count)>(series.Count);

            foreach (var (y, m, ym) in series)
            {
                if (!schoolId.HasValue)
                {
                    try
                    {
                        var cnt = _repo.GetClassworkCountForYearMonth(y, m);
                        result.Add((ym, cnt));
                    }
                    catch
                    {
                        result.Add((ym, 0));
                    }
                }
                else
                {
                    try
                    {
                        var classIds = _repo.GetAllClassIds().Where(cid => ClassBelongsToSchool(cid, schoolId.Value));
                        var sum = 0;
                        foreach (var cid in classIds) sum += _repo.GetClassworkCountForYearMonthByClass(y, m, cid);
                        result.Add((ym, sum));
                    }
                    catch
                    {
                        result.Add((ym, 0));
                    }
                }
            }

            return result;
        }

        public IReadOnlyList<(string Month, int Count)> GetNotificationsByMonthPrimitives(int months = 12, int? schoolId = null)
        {
            var series = GenerateLastNMonths(months);
            var result = new List<(string Month, int Count)>(series.Count);

            foreach (var (y, m, ym) in series)
            {
                if (!schoolId.HasValue)
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
                else
                {
                    try
                    {
                        var classIds = _repo.GetAllClassIds().Where(cid => ClassBelongsToSchool(cid, schoolId.Value));
                        var sum = 0;
                        foreach (var cid in classIds) sum += _repo.GetNotificationCountForYearMonthByClass(y, m, cid);
                        result.Add((ym, sum));
                    }
                    catch
                    {
                        result.Add((ym, 0));
                    }
                }
            }

            return result;
        }

        public IReadOnlyList<(string Month, int Count)> GetSubmissionsByMonthPrimitives(int months = 12, int? schoolId = null)
        {
            var series = GenerateLastNMonths(months);
            var result = new List<(string Month, int Count)>(series.Count);

            foreach (var (y, m, ym) in series)
            {
                if (!schoolId.HasValue)
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
                else
                {
                    try
                    {
                        var classIds = _repo.GetAllClassIds().Where(cid => ClassBelongsToSchool(cid, schoolId.Value));
                        var sum = 0;
                        foreach (var cid in classIds) sum += _repo.GetSubmissionCountForYearMonthByClass(y, m, cid);
                        result.Add((ym, sum));
                    }
                    catch
                    {
                        result.Add((ym, 0));
                    }
                }
            }

            return result;
        }

        public IReadOnlyList<(string Month, int Count)> GetNewClassesByMonthPrimitives(int months = 12, int? schoolId = null)
        {
            var series = GenerateLastNMonths(months);
            var result = new List<(string Month, int Count)>(series.Count);

            foreach (var (y, m, ym) in series)
            {
                if (!schoolId.HasValue)
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
                else
                {
                    try
                    {
                        // count classes created in that month where creator's school == schoolId
                        var cnt = _repo.GetClassCreatedCountForYearMonthBySchool(y, m, schoolId.Value);
                        result.Add((ym, cnt));
                    }
                    catch
                    {
                        result.Add((ym, 0));
                    }
                }
            }

            return result;
        }

        // Class stats optional schoolId
        public IReadOnlyList<(int ClassId, string ClassName, int StudentsCount, double SubmissionRate, double ReadRate, int ClassworksCount, int NotificationsCount, int TotalSubmissions)> GetClassStatsPrimitives(int? schoolId = null)
        {
            var classIds = _repo.GetAllClassIds();
            if (schoolId.HasValue)
                classIds = classIds.Where(cid => ClassBelongsToSchool(cid, schoolId.Value)).ToList();

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

        // Top read notifications optional schoolId
        public IReadOnlyList<(int NotificationId, string Title, string CreatedBy, int ReadsCount, int IgnoredCount, int TotalRecipients, int SubmissionsCount)> GetTopReadNotificationsPrimitives(int top = 10, int? schoolId = null)
        {
            var notifIds = _repo.GetAllNotificationIds() ?? new List<int>();
            var result = new List<(int NotificationId, string Title, string CreatedBy, int ReadsCount, int IgnoredCount, int TotalRecipients, int SubmissionsCount)>();

            foreach (var id in notifIds)
            {
                var cid = _repo.GetClassIdForNotification(id);
                if (schoolId.HasValue && !ClassBelongsToSchool(cid, schoolId.Value)) continue;

                var reads = _repo.GetReadCountForNotification(id);
                var total = _repo.GetTotalRecipientsForNotification(id);
                var subs = _repo.GetSubmissionsCountByNotificationId(id);
                var title = _repo.GetNotificationTitle(id) ?? string.Empty;
                var ignored = Math.Max(0, total - reads);
                var creatorName = _repo.GetNotificationCreatedByName(id) ?? string.Empty;
                result.Add((id, title, creatorName, reads, ignored, total, subs));
            }

            return result.OrderByDescending(x => x.ReadsCount).ThenByDescending(x => x.SubmissionsCount).Take(top).ToList();
        }

        public IReadOnlyList<(int NotificationId, string Title, string CreatedBy, int ReadsCount, int IgnoredCount, int TotalRecipients, int SubmissionsCount)> GetMostIgnoredNotificationsPrimitives(int top = 10, int? schoolId = null)
        {
            var notifIds = _repo.GetAllNotificationIds() ?? new List<int>();
            var result = new List<(int NotificationId, string Title, string CreatedBy, int ReadsCount, int IgnoredCount, int TotalRecipients, int SubmissionsCount)>();

            foreach (var id in notifIds)
            {
                var cid = _repo.GetClassIdForNotification(id);
                if (schoolId.HasValue && !ClassBelongsToSchool(cid, schoolId.Value)) continue;

                var reads = _repo.GetReadCountForNotification(id);
                var total = _repo.GetTotalRecipientsForNotification(id);
                var subs = _repo.GetSubmissionsCountByNotificationId(id);
                var title = _repo.GetNotificationTitle(id) ?? string.Empty;
                var ignored = Math.Max(0, total - reads);
                var creatorName = _repo.GetNotificationCreatedByName(id) ?? string.Empty;
                result.Add((id, title, creatorName, reads, ignored, total, subs));
            }

            return result.OrderByDescending(x => x.IgnoredCount).ThenByDescending(x => x.SubmissionsCount).Take(top).ToList();
        }

        public (int? ClassId, string ClassName, int NotificationsCount, int SubmissionsCount, int CommentsCount)? GetClassWithMostNotificationsPrimitives(int? schoolId = null)
        {
            var classIds = _repo.GetAllClassIds() ?? new List<int>();
            if (schoolId.HasValue)
                classIds = classIds.Where(cid => ClassBelongsToSchool(cid, schoolId.Value)).ToList();

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
        // Monthly helper: generate a list of last N months (year, month, "YYYY-MM"), ordered ascending
        // --------------------------------------------------------------------
        private List<(int Year, int Month, string Ym)> GenerateLastNMonths(int n)
        {
            if (n <= 0) n = 12;
            var now = DateTime.Now;
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
        // The rest of helpers remain unchanged (TryParseYearMonth etc.)
        // --------------------------------------------------------------------
        private bool TryParseYearMonth(string ym, out int year, out int month)
        {
            year = 0;
            month = 0;
            if (string.IsNullOrWhiteSpace(ym)) return false;
            var parts = ym.Split('-', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 2) return false;
            if (!int.TryParse(parts[0], out year)) return false;
            if (!int.TryParse(parts[1], out month)) return false;
            return year >= 1 && month >= 1 && month <= 12;
        }
    }
}