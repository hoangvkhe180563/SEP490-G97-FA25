using System;
using System.Collections.Generic;
using System.Linq;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Repositories.Exam;

namespace StudyHub.Backend.UseCases.Services
{
    public class ProfileService : IProfileService
    {
        private readonly IEnrollmentRepository _enrollmentRepository;
        private readonly ICourseRepository _courseRepository;
        private readonly IProgressRepository _progressRepository;
        private readonly IChapterRepository _chapterRepository;
        private readonly IExamResultRepository _examResultRepository;
        private readonly StudyHub.Backend.UseCases.Repositories.Exam.IExamRepository _examRepository;
        private readonly IClassRepository _classRepository;

        public ProfileService(IEnrollmentRepository enrollmentRepository, ICourseRepository courseRepository, IProgressRepository progressRepository, IChapterRepository chapterRepository, IExamResultRepository examResultRepository, StudyHub.Backend.UseCases.Repositories.Exam.IExamRepository examRepository, IClassRepository classRepository)
        {
            _enrollmentRepository = enrollmentRepository;
            _courseRepository = courseRepository;
            _progressRepository = progressRepository;
            _chapterRepository = chapterRepository;
            _examResultRepository = examResultRepository;
            _examRepository = examRepository;
            _classRepository = classRepository; // Assigning the new parameter to the field
        }

        public UserLearningProfile GetUserLearningProfile(Guid userId)
        {
            var profile = new UserLearningProfile
            {
                UserId = userId.ToString(),
                SchoolId = 0
            };

            // Compute class-based metrics first (CurrentGrades, CurrentSubjectStudied, SubjectStrength, WorkSpeed)
            var classes = _classRepository.GetAllClassByUserId(userId);

            var subjectClassAverages = new Dictionary<string, List<float>>(); // per-subject list of class-average scores
            var subjectClassWorkHours = new Dictionary<string, List<double>>(); // per-subject list of class-average hours

            foreach (var cls in classes)
            {
                try
                {
                    if (!string.IsNullOrWhiteSpace(cls.Name))
                    {
                        var ch = cls.Name.FirstOrDefault(c => char.IsDigit(c));
                        if (ch != default(char))
                        {
                            var parsedGrade = ch - '0';
                            if (parsedGrade >= 0)
                            {
                                profile.CurrentGrades.Add(parsedGrade);
                            }
                        }
                    }
                }
                catch
                {
                    // ignore parsing issues
                }
                // collect scores/hours per subject for this class
                var classSubjectScores = new Dictionary<string, List<float>>();
                var classSubjectHours = new Dictionary<string, List<double>>();

                var classExams = _examRepository.GetAllClassExams(cls.Id);
                foreach (var exam in classExams)
                {
                    // map exam -> lesson -> course -> subject
                    string subjectName = "Unknown";
                    var courseId = 0;
                    if (exam.LessonId > 0)
                    {
                        courseId = _examRepository.GetCourseIdByLessonId(exam.LessonId);
                        var course = _courseRepository.GetCourseById(courseId);
                        if (course != null)
                        {
                            subjectName = course.Subject?.Name ?? subjectName;
                        }
                    }

                    if (!profile.CurrentSubjectStudied.Contains(subjectName)) profile.CurrentSubjectStudied.Add(subjectName);

                    // parse grade from class name (take first numeric digit only)


                    // get student's results for this exam
                    var studentResults = _examResultRepository.GetResultsByExamIdAndStudentId(exam.Id, userId);
                    foreach (var res in studentResults)
                    {
                        if (!classSubjectScores.ContainsKey(subjectName)) classSubjectScores[subjectName] = new List<float>();
                        classSubjectScores[subjectName].Add((float)res.Score / 100f);

                        // compute time taken relative to exam open time
                        try
                        {
                            if (res.SubmissionTime != default && exam.OpenTime != default && res.SubmissionTime > exam.OpenTime)
                            {
                                var hours = (res.SubmissionTime - exam.OpenTime).TotalHours;
                                if (hours >= 0)
                                {
                                    if (!classSubjectHours.ContainsKey(subjectName)) classSubjectHours[subjectName] = new List<double>();
                                    classSubjectHours[subjectName].Add(hours);
                                }
                            }
                        }
                        catch
                        {
                            // ignore date issues
                        }
                    }
                }

                // compute per-class average per subject and add to global lists
                foreach (var kv in classSubjectScores)
                {
                    var subj = kv.Key;
                    var avg = kv.Value.Count > 0 ? kv.Value.Average() : 0f;
                    if (!subjectClassAverages.ContainsKey(subj)) subjectClassAverages[subj] = new List<float>();
                    subjectClassAverages[subj].Add(avg);
                }

                foreach (var kv in classSubjectHours)
                {
                    var subj = kv.Key;
                    var avgHours = kv.Value.Count > 0 ? kv.Value.Average() : 0.0;
                    if (!subjectClassWorkHours.ContainsKey(subj)) subjectClassWorkHours[subj] = new List<double>();
                    subjectClassWorkHours[subj].Add(avgHours);
                }
            }

            // now map class aggregates into SubjectStrength and WorkSpeed (preliminary)
            var enrollments = _enrollmentRepository.GetEnrollmentsByUser(userId);
            var subjectCourseWatch = new Dictionary<string, List<float>>();
            var subjectExamScores = new Dictionary<string, List<float>>();
            var subjectWorkHours = new Dictionary<string, List<double>>();

            // SubjectStrength: average of class averages per subject
            foreach (var kv in subjectClassAverages)
            {
                var subj = kv.Key;
                var classAvgs = kv.Value;
                var strength = classAvgs.Count > 0 ? classAvgs.Average() : 0f;
                profile.SubjectStrength[subj] = (float)Math.Round(strength, 4);
            }

            // WorkSpeed: normalize averaged class hours -> closer to 1 is faster
            foreach (var kv in subjectClassWorkHours)
            {
                var subj = kv.Key;
                var avgHours = kv.Value.Count > 0 ? kv.Value.Average() : 0.0;
                var norm = 1.0 - Math.Min(avgHours / 720.0, 1.0);
                profile.WorkSpeed[subj] = (float)Math.Round((float)norm, 4);
            }

            foreach (var en in enrollments)
            {
                var course = _courseRepository.GetCourseById(en.CourseId);
                if (course == null) continue;

                var subjectName = course.Subject?.Name ?? "Unknown";

                // course watch percentage: lesson progresses / total lessons
                var chapters = _chapterRepository.GetChaptersByCourseId(course.Id);
                var totalLessons = chapters.SelectMany(ch => ch.Lessons).Count();
                var progresses = _progressRepository.GetProgressesByEnrollment(en.Id);
                var doneCount = progresses.Count;
                float courseWatch = 0f;
                if (totalLessons > 0) courseWatch = (float)doneCount / totalLessons;

                if (!subjectCourseWatch.ContainsKey(subjectName)) subjectCourseWatch[subjectName] = new List<float>();
                subjectCourseWatch[subjectName].Add(courseWatch);

                // work speed: average hours from enrollment to progress completion for this enrollment
                if (progresses.Count > 0)
                {
                    var hours = progresses.Select(p => (p.CompletionDate - en.EnrollmentDate).TotalHours).Where(h => h >= 0).ToList();
                    if (hours.Count > 0)
                    {
                        var avgHours = hours.Average();
                        if (!subjectWorkHours.ContainsKey(subjectName)) subjectWorkHours[subjectName] = new List<double>();
                        subjectWorkHours[subjectName].Add(avgHours);
                    }
                }
            }

            // Subject accuracy: from exam results
            var examResults = _examResultRepository.GetResultsByStudentId(userId);
            foreach (var res in examResults)
            {
                try
                {
                    string subject = "Unknown";
                    var exam = _examRepository.GetExamById(res.ExamId);
                    if (exam != null && exam.LessonId > 0)
                    {
                        var courseId = _examRepository.GetCourseIdByLessonId(exam.LessonId);
                        var course = _courseRepository.GetCourseById(courseId);
                        if (course != null) subject = course.Subject?.Name ?? subject;
                    }

                    if (!subjectExamScores.ContainsKey(subject)) subjectExamScores[subject] = new List<float>();
                    // Score decimal to float normalized 0..1 (assume score max 100)
                    subjectExamScores[subject].Add((float)res.Score / 100f);
                }
                catch
                {
                    // ignore mapping errors
                }
            }

            // Aggregate per-subject metrics
            foreach (var kv in subjectCourseWatch)
            {
                var subj = kv.Key;
                var avgWatch = kv.Value.Count > 0 ? kv.Value.Average() : 0f;
                profile.CourseWatchPercentage[subj] = (float)Math.Round(avgWatch, 4);
            }

            foreach (var kv in subjectExamScores)
            {
                var subj = kv.Key;
                var avg = kv.Value.Count > 0 ? kv.Value.Average() : 0f;
                profile.SubjectAccuracy[subj] = (float)Math.Round(avg, 4);
            }

            foreach (var kv in subjectWorkHours)
            {
                var subj = kv.Key;
                var avgHours = kv.Value.Average();
                // Normalize work speed: faster (smaller hours) -> closer to 1. Cap normalization at 720 hours (30 days)
                var norm = 1.0 - Math.Min(avgHours / 720.0, 1.0);
                profile.WorkSpeed[subj] = (float)Math.Round((float)norm, 4);
            }

            // Subject strength: combine watch and accuracy (60% watch, 40% accuracy) if both exist, else fallback
            var subjects = new HashSet<string>(profile.CurrentSubjectStudied.Concat(profile.SubjectAccuracy.Keys).Concat(profile.CourseWatchPercentage.Keys));
            foreach (var subj in subjects)
            {
                float watch = profile.CourseWatchPercentage.ContainsKey(subj) ? profile.CourseWatchPercentage[subj] : 0f;
                float acc = profile.SubjectAccuracy.ContainsKey(subj) ? profile.SubjectAccuracy[subj] : 0f;
                var strength = 0.6f * watch + 0.4f * acc;
                profile.SubjectStrength[subj] = (float)Math.Round(strength, 4);
            }

            // dedupe current grades
            profile.CurrentGrades = profile.CurrentGrades.Distinct().ToList();

            return profile;
        }
    }
}
