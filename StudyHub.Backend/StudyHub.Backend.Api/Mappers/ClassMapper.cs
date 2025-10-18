using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Dtos.AppUserDTOS;
using StudyHub.Backend.Api.Dtos.ClassDTOS;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using System.Runtime.CompilerServices;

namespace StudyHub.Backend.Api.Mappers
{
    public static class ClassMapper
    {
        public static ClassListDto ToListClassDto(this Class c, AppUser? t, Subject? s) => new ClassListDto
        {
            Id = c.Id,
            Name = c.Name,

            SubjectName = s?.Name ?? "N/A",
            InstructorName = t?.Fullname ?? "Không rõ",
            Description = c.Description,
            SubjectId = c.SubjectId
        };

        public static Class ToEntity(this CreateClassDto dto)
        {
            return new Class
            {
                Name = dto.Name,
                SubjectId = dto.SubjectId,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow
            };
        }
        public static Class ToEntity(this EditClassDto dto)
        {
            return new Class
            {
                Name = dto.Name,
                SubjectId = dto.SubjectId,
                Description = dto.Description,
                UpdatedAt = DateTime.UtcNow
            };
        }
        public static ClassDetailDto ToDetailDto(this Class c) => new ClassDetailDto
        {
            Id = c.Id,
            Name = c.Name,
            SubjectId = c.SubjectId,
            Description = c.Description,
            CreatedAt = c.CreatedAt,
            CreatedBy = c.CreatedBy,
            UpdatedAt = c.UpdatedAt,
            UpdatedBy = c.UpdatedBy,
            DeletedAt = c.DeletedAt,
        };
        public static ClassPostDTO ToFullDetailDto(
           this Class c,
           List<MemberDto> members,
           List<NotificationDto> notifications)
        {
            return new ClassPostDTO
            {
                Id = c.Id,
                Name = c.Name,
                SubjectId = c.SubjectId,
                Description = c.Description,
                CreatedAt = c.CreatedAt,

                Members = members,
                Notifications = notifications
            };
        }

        public static MemberDto ToMemberDto(this ClassMember member, AppUserDetailDto? user)
        {
            return new MemberDto
            {
                UserId = member.UserId,
                Fullname = user?.Fullname ?? "Không rõ",
                JoinDate = member.JoinDate,
                Roles = user.Roles
            };
        }

        public static NotificationDto ToNotificationDto(this ClassNotification noti)
        {
            return new NotificationDto
            {
                Id = noti.Id,
                Title = noti.Title,
                Description = noti.Description
            };
        }
    }
}
