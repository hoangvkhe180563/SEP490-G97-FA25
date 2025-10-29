using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos.CourseDTOS;

namespace StudyHub.Backend.Api.Mappers
{
    public static class LectureMapper
    {
        // ======================
        // 🔹 Chapter → ChapterListDto
        // ======================
        public static ChapterListDto ToListDto(this Chapter ch) => new ChapterListDto
        {
            Id = ch.Id,
            Name = ch.Name,
            CourseId = ch.CourseId,
            Description = ch.Description,
            PostDate = ch.PostDate,
            Lessons = ch.Lessons?.Select(l => l.ToListDto()).ToList() ?? new List<LessonListDto>(),
        };

        // ======================
        // 🔹 Lesson → LessonListDto
        // ======================
        public static LessonListDto ToListDto(this Lesson l) => new LessonListDto
        {
            Id = l.Id,
            Name = l.Name,
            ChapterId = l.ChapterId,
            Type = l.Type,
            VideoUrl = l.LessonVideo?.Url,
            ReadingContent = l.LessonReading?.Content,
            Duration = l.Duration,
            Description = l.Description,
            PostDate = l.PostDate,
            IsPreview = l.IsPreview,
            ResourceId = l.ResourceId
        };

        // ======================
        // 🔹 Chapter → ChapterDto
        // ======================
        public static ChapterDto ToDto(this Chapter ch) => new ChapterDto
        {
            Name = ch.Name,
            CourseId = ch.CourseId,
            Lessons = ch.Lessons?.Select(l => l.ToDto()).ToList() ?? new List<LessonDto>(),
            Description = ch.Description,
            PostDate = ch.PostDate,
        };

        // ======================
        // 🔹 Lesson → LessonDto
        // ======================
        public static LessonDto ToDto(this Lesson l) => new LessonDto
        {
            Name = l.Name,
            ChapterId = l.ChapterId,
            Type = l.Type,
            VideoUrl = l.LessonVideo?.Url,
            ReadingContent = l.LessonReading?.Content,
            Duration = l.Duration,
            Description = l.Description,
            PostDate = l.PostDate,
            IsPreview = l.IsPreview,
            ResourceId = l.ResourceId
        };

        // ======================
        // 🔹 ChapterDto → Chapter
        // ======================
        public static Chapter ToEntity(this ChapterDto dto) => new Chapter
        {
            Name = dto.Name,
            CourseId = dto.CourseId,
            Description = dto.Description,
            PostDate = dto.PostDate,
            Lessons = dto.Lessons?.Select(l => l.ToEntity()).ToList() ?? new List<Lesson>(),
        };

        // ======================
        // 🔹 ChapterListDto → Chapter
        // ======================
        public static Chapter ToEntity(this ChapterListDto dto) => new Chapter
        {
            Id = dto.Id,
            Name = dto.Name,
            CourseId = dto.CourseId,
            Description = dto.Description,
            PostDate = dto.PostDate,
            Lessons = dto.Lessons?.Select(l => l.ToEntity()).ToList() ?? new List<Lesson>(),
        };

        // ======================
        // 🔹 LessonDto → Lesson
        // ======================
        public static Lesson ToEntity(this LessonDto dto)
        {
            var lesson = new Lesson
            {
                Name = dto.Name,
                ChapterId = dto.ChapterId,
                Type = dto.Type,
                LessonVideo = !string.IsNullOrEmpty(dto.VideoUrl) ? new LessonVideo { Url = dto.VideoUrl } : null,
                LessonReading = !string.IsNullOrEmpty(dto.ReadingContent) ? new LessonReading { Content = dto.ReadingContent } : null,
                Duration = dto.Duration,
                Description = dto.Description,
                PostDate = dto.PostDate,
                IsPreview = dto.IsPreview,
                ResourceId = dto.ResourceId
            };

            if (!string.IsNullOrEmpty(dto.VideoUrl))
                lesson.LessonVideo = new LessonVideo { Url = dto.VideoUrl };

            if (!string.IsNullOrEmpty(dto.ReadingContent))
                lesson.LessonReading = new LessonReading { Content = dto.ReadingContent };

            return lesson;
        }

        // ======================
        // 🔹 LessonListDto → Lesson
        // ======================
        public static Lesson ToEntity(this LessonListDto dto)
        {
            var lesson = new Lesson
            {
                Id = dto.Id,
                Name = dto.Name,
                ChapterId = dto.ChapterId,
                Type = dto.Type,
                LessonVideo = !string.IsNullOrEmpty(dto.VideoUrl) ? new LessonVideo { Url = dto.VideoUrl } : null,
                LessonReading = !string.IsNullOrEmpty(dto.ReadingContent) ? new LessonReading { Content = dto.ReadingContent } : null,
                Duration = dto.Duration,
                Description = dto.Description,
                PostDate = dto.PostDate,
                IsPreview = dto.IsPreview,
                ResourceId = dto.ResourceId
            };

            if (!string.IsNullOrEmpty(dto.VideoUrl))
                lesson.LessonVideo = new LessonVideo { Url = dto.VideoUrl };

            if (!string.IsNullOrEmpty(dto.ReadingContent))
                lesson.LessonReading = new LessonReading { Content = dto.ReadingContent };

            return lesson;
        }
    }
}
