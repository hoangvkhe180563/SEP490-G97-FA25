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
            Status = ch.Status,
            Lessons = ch.Lessons?.Select(l => l.ToListDto()).ToList() ?? new List<LessonListDto>(),
            Description = ch.Description,
            PostDate = ch.PostDate,
        };

        // ======================
        // 🔹 Lesson → LessonListDto
        // ======================
        public static LessonListDto ToListDto(this Lesson l) => new LessonListDto
        {
            Id = l.Id,
            Name = l.Name,
            ChapterId = l.ChapterId,
            Status = l.Status,
            Type = l.Type,
            VideoUrl = l.LessonVideo?.Url,
            ReadingContent = l.LessonReading?.Content,
            Duration = l.Duration,
            Description = l.Description,
            PostDate = l.PostDate,
            IsPreview = l.IsPreview
        };

        // ======================
        // 🔹 Chapter → ChapterDto
        // ======================
        public static ChapterDto ToDto(this Chapter ch) => new ChapterDto
        {
            Name = ch.Name,
            CourseId = ch.CourseId,
            Status = ch.Status,
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
            Status = l.Status,
            Type = l.Type,
            VideoUrl = l.LessonVideo?.Url,
            ReadingContent = l.LessonReading?.Content,
            Duration = l.Duration,
            Description = l.Description,
            PostDate = l.PostDate,
            IsPreview = l.IsPreview
        };

        // ======================
        // 🔹 ChapterDto → Chapter
        // ======================
        public static Chapter ToEntity(this ChapterDto dto) => new Chapter
        {
            Name = dto.Name,
            CourseId = dto.CourseId,
            Status = dto.Status,
            Lessons = dto.Lessons?.Select(l => l.ToEntity()).ToList() ?? new List<Lesson>(),
            Description = dto.Description,
            PostDate = dto.PostDate
        };

        // ======================
        // 🔹 ChapterListDto → Chapter
        // ======================
        public static Chapter ToEntity(this ChapterListDto dto) => new Chapter
        {
            Id = dto.Id,
            Name = dto.Name,
            CourseId = dto.CourseId,
            Status = dto.Status,
            Lessons = dto.Lessons?.Select(l => l.ToEntity()).ToList() ?? new List<Lesson>(),
            Description = dto.Description,
            PostDate = dto.PostDate
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
                Status = dto.Status,
                Type = dto.Type,
                LessonVideo = !string.IsNullOrEmpty(dto.VideoUrl) ? new LessonVideo { Url = dto.VideoUrl } : null,
                LessonReading = !string.IsNullOrEmpty(dto.ReadingContent) ? new LessonReading { Content = dto.ReadingContent } : null,
                Duration = dto.Duration,
                Description = dto.Description,
                PostDate = dto.PostDate,
                IsPreview = dto.IsPreview
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
                Status = dto.Status,
                Type = dto.Type,
                LessonVideo = !string.IsNullOrEmpty(dto.VideoUrl) ? new LessonVideo { Url = dto.VideoUrl } : null,
                LessonReading = !string.IsNullOrEmpty(dto.ReadingContent) ? new LessonReading { Content = dto.ReadingContent } : null,
                Duration = dto.Duration,
                Description = dto.Description,
                PostDate = dto.PostDate,
                IsPreview = dto.IsPreview
            };

            if (!string.IsNullOrEmpty(dto.VideoUrl))
                lesson.LessonVideo = new LessonVideo { Url = dto.VideoUrl };

            if (!string.IsNullOrEmpty(dto.ReadingContent))
                lesson.LessonReading = new LessonReading { Content = dto.ReadingContent };

            return lesson;
        }
    }
}
