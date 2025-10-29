using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Dtos.AppUserDTOS;
using StudyHub.Backend.Api.Dtos.ClassDTOS;
using StudyHub.Backend.Api.Dtos.ClassworkDTOS;
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
           List<NotificationDto> notifications)
        {
            return new ClassPostDTO
            {
                Id = c.Id,
                Name = c.Name,
                SubjectId = c.SubjectId,
                Description = c.Description,
                CreatedAt = c.CreatedAt,

                Notifications = notifications
            };
        }

        public static MemberDto ToMemberDto(this ClassMember member, AppUser? user, List<string> roles, School school, Commune commune)
        {
            return new MemberDto
            {
                UserId = member.UserId,
                Fullname = user?.Fullname ?? "Không rõ",
                JoinDate = member.JoinDate,
                Email = user.Email,
                Roles = roles,
                Gender = user.Gender,
                SchoolId = user.SchoolId,
                CommuneId=user.CommuneId,
                Address = user.Address,
                PhoneNumber = user.PhoneNumber,
                Wallet = user.Wallet,
                SchoolName = school!=null?school.Name:"",
                Communes = commune!=null?commune.Name:""

            };
        }

        public static NotificationDto ToNotificationDto(this ClassNotification noti)
        {
            return new NotificationDto
            {
                Id = noti.Id,
                Title = noti.Title,
                Description = noti.Description,
                CreatedBy = noti.AppUserId,
                CreatedAt = noti.CreatedAt,
                
            };
        }
        public static NotificationDto ToNotificationDto(
             this ClassNotification entity,
              AppUser user, 
             List<FileDto>? files = null,
             List<CommentDto>? comments = null
            )
        {
            return new NotificationDto
            {
                Id = entity.Id,
                ClassId = entity.ClassId,
                Title = entity.Title,
                Description = entity.Description,
                CreatedBy = entity.CreatedBy,
                CreatedAt = DateTime.Now,
                Files = files ?? new List<FileDto>(),
                Comments = comments ?? new List<CommentDto>(),
                Arthur = user.Fullname,
                Avatar = user.Avatar
            };
        }

        public static FileDto ToFileDto(this ClassNotificationFile file)
        {
            return new FileDto
            {
                Id = file.Id,
                FileName = file.FileName,
                FileUrl = file.FileUrl
            };
        }

        public static CommentDto ToCommentDto(this ClassNotificationComment comment, AppUser user)
        {
            return new CommentDto
            {
                Id = comment.Id,
                NotificationId = comment.NotificationId,
                UserId = comment.AppUserId,
                Content = comment.Content,
                CreatedAt = comment.CreatedAt,
                UserFullname = user?.Fullname ?? "Unknown",
                ImageUrl = user.Avatar
            };
        }
        public static SubmissionFIleDto ToSubmissionDto(this ClassworkSubmission sub, List<SubmissionFile> file)
        {
            return new SubmissionFIleDto
            {
                Id = sub.Id,
                ClassworkId = sub.ClassworkId,
                AppUserId = sub.AppUserId,
                FirstSubmissionTime = sub.FirstSubmissionTime,
                LatestSubmissionTime = sub.LatestSubmissionTime,
                SubmissionFiles = file
            };
        }
    }
}
