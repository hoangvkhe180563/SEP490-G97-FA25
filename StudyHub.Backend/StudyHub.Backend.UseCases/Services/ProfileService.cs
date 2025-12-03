using System;
using System.Collections.Generic;
using System.Linq;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Repositories.Exam;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Services
{
    public class ProfileService
    {
        private readonly IEnrollmentRepository _enrollmentRepository;
        private readonly ICourseRepository _courseRepository;
        private readonly IProgressRepository _progressRepository;
        private readonly IChapterRepository _chapterRepository;
        private readonly IExamResultRepository _examResultRepository;
        private readonly StudyHub.Backend.UseCases.Repositories.Exam.IExamRepository _examRepository;
        private readonly AuthService _authService;
        private readonly IClassRepository _classRepository;
        private readonly IClassMemberRepository _classMemberRepository;
        private readonly IAppUserRepository _appUserRepository;

        public ProfileService(
            IEnrollmentRepository enrollmentRepository,
            ICourseRepository courseRepository,
            IProgressRepository progressRepository,
            IChapterRepository chapterRepository,
            IExamResultRepository examResultRepository,
            StudyHub.Backend.UseCases.Repositories.Exam.IExamRepository examRepository,
            IClassRepository classRepository,
            IClassMemberRepository classMemberRepository,
            IAppUserRepository appUserRepository,
            AuthService authService)
        {
            _enrollmentRepository = enrollmentRepository;
            _courseRepository = courseRepository;
            _progressRepository = progressRepository;
            _chapterRepository = chapterRepository;
            _examResultRepository = examResultRepository;
            _examRepository = examRepository;
            _classRepository = classRepository; // Assigning the new parameter to the field
            _classMemberRepository = classMemberRepository;
            _appUserRepository = appUserRepository;
            _authService = authService;
        }

        public UserLearningProfile GetUserLearningProfile()
        {
            var profile = new UserLearningProfile();

            // obtain current user from auth service
            var current = _authService.GetCurrentUser();
            if (current == null) return profile;

            var userId = current.Id;
            profile.UserId = userId.ToString();
            profile.SchoolId = current?.SchoolId ?? 0;

            // classes the user belongs to
            var classes = _classRepository.GetClassByUserId(userId) ?? new List<Class>();

            // current grades
            profile.CurrentGrades = classes.Select(c => (int)c.Grade).Distinct().ToList();

            // prepare subject lookup
            var allSubjects = _classRepository.GetAllSubject();
            if (allSubjects == null) allSubjects = new List<Subject>();
            var subjectMap = allSubjects.ToDictionary(s => s.Id, s => s.Name ?? string.Empty);

            // collect subject ids from class exams (subjects student studies via class)
            var classIds = classes.Select(c => c.Id).Distinct().ToList();
            var subjectIdsStudied = new HashSet<short>();
            foreach (var cid in classIds)
            {
                var exams = _examRepository.GetAllClassExams(cid) ?? new List<Domain.Entities.Exam.Exam>();
                foreach (var ex in exams)
                {
                    if (ex.SubjectId.HasValue)
                        subjectIdsStudied.Add((short)ex.SubjectId.Value);
                }
            }

            // Additionally, include subjects owned by teachers in these classes.
            // For each class get its members; if a member is not the current user and has a teacher role
            // (Subject Teacher or Homeroom Teacher) then include their subject ids.
            foreach (var cid in classIds)
            {
                var members = _classMemberRepository.GetClassMembers(cid) ?? new List<AppUserClass>();
                foreach (var m in members)
                {
                    if (m.UserId == userId) continue; // skip current user

                    // get role names for the member
                    var roles = _appUserRepository.GetUserRoleNames(m.UserId) ?? new List<string>();
                    var hasTeacherRole = roles.Any(r => string.Equals(r, "Subject Teacher", StringComparison.OrdinalIgnoreCase) || string.Equals(r, "Homeroom Teacher", StringComparison.OrdinalIgnoreCase));
                    if (!hasTeacherRole) continue;

                    // get subject ids owned by that teacher and add them
                    var teacherSubjectIds = _appUserRepository.GetUserSubjectIds(m.UserId) ?? new List<short>();
                    foreach (var sid in teacherSubjectIds)
                    {
                        subjectIdsStudied.Add(sid);
                    }
                }
            }
            profile.CurrentSubjectStudied = subjectIdsStudied.Select(id => subjectMap.ContainsKey(id) ? subjectMap[id] : id.ToString()).ToList();

            // get all exam results for this student
            var results = _examResultRepository.GetResultsByStudentId(userId) ?? new List<Domain.Entities.Exam.ExamResult>();

            // SubjectStrength: average score on class exams (only exams belonging to user's classes)
            var strengthGroups = new Dictionary<short, List<decimal>>();
            foreach (var r in results)
            {
                var ex = _examRepository.GetExamById(r.ExamId);
                if (ex == null) continue;
                if (ex.ClassId != 0 && classIds.Contains(ex.ClassId))
                {
                    var sid = ex.SubjectId ?? 0;
                    if (!strengthGroups.ContainsKey((short)sid)) strengthGroups[(short)sid] = new List<decimal>();
                    strengthGroups[(short)sid].Add(r.Score);
                }
            }
            var strengthBySub = new Dictionary<string, float>();
            foreach (var kv in strengthGroups)
            {
                var avg = kv.Value.Average();
                var norm = avg > 1 ? (double)(avg / 100m) : (double)avg;
                var name = subjectMap.ContainsKey(kv.Key) ? subjectMap[kv.Key] : kv.Key.ToString();
                strengthBySub[name] = (float)Math.Round(norm, 3);
            }
            profile.SubjectStrength = strengthBySub;

            // SubjectAccuracy: average score for lesson exams that belong to courses
            var accuracyGroups = new Dictionary<short, List<decimal>>();
            foreach (var r in results)
            {
                var ex = _examRepository.GetExamById(r.ExamId);
                if (ex == null) continue;
                if (ex.LessonId != 0)
                {
                    var courseId = _examRepository.GetCourseIdByLessonId(ex.LessonId);
                    if (courseId != 0)
                    {
                        var sid = ex.SubjectId ?? 0;
                        if (!accuracyGroups.ContainsKey((short)sid)) accuracyGroups[(short)sid] = new List<decimal>();
                        accuracyGroups[(short)sid].Add(r.Score);
                    }
                }
            }
            var accuracyBySub = new Dictionary<string, float>();
            foreach (var kv in accuracyGroups)
            {
                var avg = kv.Value.Average();
                var norm = avg > 1 ? (double)(avg / 100m) : (double)avg;
                var name = subjectMap.ContainsKey(kv.Key) ? subjectMap[kv.Key] : kv.Key.ToString();
                accuracyBySub[name] = (float)Math.Round(norm, 3);
            }
            profile.SubjectAccuracy = accuracyBySub;

            // WorkSpeed: based on exam duration and submission times for class exams
            var speedGroups = new Dictionary<short, List<double>>();
            foreach (var r in results)
            {
                var ex = _examRepository.GetExamById(r.ExamId);
                if (ex == null) continue;
                if (ex.ClassId != 0 && classIds.Contains(ex.ClassId))
                {
                    if (r.SubmissionTime != default && r.FinishTime != default)
                    {
                        var timeTaken = Math.Abs((r.SubmissionTime - r.FinishTime).TotalSeconds);
                        var maxSeconds = (double)(ex.Duration * 60);
                        var speed = maxSeconds <= 0 ? 0 : Math.Min(1.0, maxSeconds / Math.Max(1.0, timeTaken));
                        var sid = ex.SubjectId ?? 0;
                        if (!speedGroups.ContainsKey((short)sid)) speedGroups[(short)sid] = new List<double>();
                        speedGroups[(short)sid].Add(speed);
                    }
                }
            }
            var workSpeed = new Dictionary<string, float>();
            foreach (var kv in speedGroups)
            {
                var avg = kv.Value.Average();
                var name = subjectMap.ContainsKey(kv.Key) ? subjectMap[kv.Key] : kv.Key.ToString();
                workSpeed[name] = (float)Math.Round(avg, 3);
            }
            profile.WorkSpeed = workSpeed;

            // CourseWatchPercentage: for each enrollment, percentage of lessons completed in course, grouped by subject name
            var enrollments = _enrollmentRepository.GetEnrollmentsByUser(userId) ?? new List<Enrollment>();
            var courseWatch = new Dictionary<string, float>();
            foreach (var en in enrollments)
            {
                var course = _courseRepository.GetCourseById(en.CourseId);
                if (course == null) continue;
                var chapters = _chapterRepository.GetChaptersByCourseId(course.Id) ?? new List<Chapter>();
                var totalLessons = chapters.Sum(ch => ch.Lessons?.Count ?? 0);
                var progresses = _progressRepository.GetProgressesByEnrollment(en.Id) ?? new List<CourseProgress>();
                var completed = progresses.Select(p => p.LessonId).Distinct().Count();
                var pct = totalLessons == 0 ? 0f : (float)completed / (float)totalLessons;
                var subjName = subjectMap.ContainsKey((short)course.SubjectId) ? subjectMap[(short)course.SubjectId] : course.SubjectId.ToString();
                courseWatch[subjName] = (float)Math.Round(pct, 3);
            }
            profile.CourseWatchPercentage = courseWatch;

            return profile;
        }
    }
}
