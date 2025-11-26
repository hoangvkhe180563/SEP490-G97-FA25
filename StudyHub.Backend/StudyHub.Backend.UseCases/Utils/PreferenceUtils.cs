using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases.Utils
{
    public class PreferenceUtils
    {
        public static List<CourseSubjectPreference> CalculateCourseSubjectPreferences(UserLearningProfile profile)
        {
            var preferences = new List<CourseSubjectPreference>();

            foreach (var subject in profile.CurrentSubjectStudied)
            {
                var pref = new CourseSubjectPreference { SubjectName = subject };

                // Lấy các giá trị, mặc định = 0.5 nếu không có
                var strength = profile.SubjectStrength.GetValueOrDefault(subject, 0.5f);
                var workSpeed = profile.WorkSpeed.GetValueOrDefault(subject, 0.5f);
                var accuracy = profile.SubjectAccuracy.GetValueOrDefault(subject, 0.5f);
                var watchPercent = profile.CourseWatchPercentage.GetValueOrDefault(subject, 0.5f);

                // Tính DifficultyScore
                pref.DifficultyScore =
                    0.4f * strength +
                    0.1f * workSpeed +
                    0.1f * watchPercent +
                    0.4f * accuracy;

                // Xác định PreferredDifficulty
                if (pref.DifficultyScore >= 0.75f)
                    pref.PreferredDifficulty = CourseDifficulty.Advanced;
                else if (pref.DifficultyScore >= 0.55f)
                    pref.PreferredDifficulty = CourseDifficulty.Intermediate;
                else
                    pref.PreferredDifficulty = CourseDifficulty.Beginner;

                // Tính LengthPreferenceScore
                pref.LengthPreferenceScore =
                    0.5f * workSpeed +
                    0.3f * watchPercent +
                    0.2f * accuracy;

                // Xác định PreferredLength
                if (pref.LengthPreferenceScore >= 0.75f)
                    pref.PreferredLength = CourseLength.Long;
                else if (pref.LengthPreferenceScore >= 0.55f)
                    pref.PreferredLength = CourseLength.Medium;
                else
                    pref.PreferredLength = CourseLength.Short;

                // Tính độ ưu tiên môn yếu (strength càng thấp càng ưu tiên cao)
                pref.WeakSubjectPriority = 1.0f - strength;

                preferences.Add(pref);
            }

            return preferences;
        }

        public static List<DocumentSubjectPreference> CalculateDocumentSubjectPreferences(UserLearningProfile profile)
        {
            var preferences = new List<DocumentSubjectPreference>();

            foreach (var subject in profile.CurrentSubjectStudied)
            {
                var pref = new DocumentSubjectPreference { SubjectName = subject };

                // Lấy các giá trị, mặc định = 0.5 nếu không có
                var strength = profile.SubjectStrength.GetValueOrDefault(subject, 0.5f);
                var workSpeed = profile.WorkSpeed.GetValueOrDefault(subject, 0.5f);
                var accuracy = profile.SubjectAccuracy.GetValueOrDefault(subject, 0.5f);
                var watchPercent = profile.CourseWatchPercentage.GetValueOrDefault(subject, 0.5f);

                // Tính DifficultyScore
                pref.DifficultyScore =
                    0.4f * strength +
                    0.1f * workSpeed +
                    0.1f * watchPercent +
                    0.4f * accuracy;

                // Xác định PreferredDifficulty
                if (pref.DifficultyScore >= 0.75f)
                    pref.PreferredDifficulty = "Hard";
                else if (pref.DifficultyScore >= 0.55f)
                    pref.PreferredDifficulty = "Medium";
                else
                    pref.PreferredDifficulty = "Easy";

                // Tính LengthPreferenceScore
                pref.LengthPreferenceScore =
                    0.5f * workSpeed +
                    0.3f * watchPercent +
                    0.2f * accuracy;

                // Xác định PreferredLength
                if (pref.LengthPreferenceScore >= 0.75f)
                    pref.PreferredLength = "Long";
                else if (pref.LengthPreferenceScore >= 0.55f)
                    pref.PreferredLength = "Medium";
                else
                    pref.PreferredLength = "Short";

                // Tính độ ưu tiên môn yếu (strength càng thấp càng ưu tiên cao)
                pref.WeakSubjectPriority = 1.0f - strength;

                preferences.Add(pref);
            }

            return preferences;
        }
    }
}
