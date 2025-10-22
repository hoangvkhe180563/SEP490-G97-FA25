using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos.CourseDTOS;

namespace StudyHub.Backend.Api.Mappers;

public static class EnrollmentMapper
{
    public static EnrollmentListDto ToListDto(this Enrollment e) => new EnrollmentListDto { Id = e.Id, AppUserId = e.AppUserId, CourseId = e.CourseId, EnrollmentDate = e.EnrollmentDate };
    public static EnrollmentDto ToDto(this Enrollment e) => new EnrollmentDto { AppUserId = e.AppUserId, CourseId = e.CourseId, EnrollmentDate = e.EnrollmentDate };
    public static Enrollment ToEntity(this EnrollmentDto d) => new Enrollment {AppUserId = d.AppUserId, CourseId = d.CourseId, EnrollmentDate = d.EnrollmentDate };
    public static ProgressListDto ToListDto(this CourseProgress p) => new ProgressListDto { Id = p.Id, EnrollmentId = p.EnrollmentId, LessonId = p.LessonId, CompletionDate = p.CompletionDate };
    public static ProgressDto ToDto(this CourseProgress p) => new ProgressDto { EnrollmentId = p.EnrollmentId, LessonId = p.LessonId, CompletionDate = p.CompletionDate };
    public static CourseProgress ToEntity(this ProgressDto d) => new CourseProgress { EnrollmentId = d.EnrollmentId, LessonId = d.LessonId, CompletionDate = d.CompletionDate };
}
