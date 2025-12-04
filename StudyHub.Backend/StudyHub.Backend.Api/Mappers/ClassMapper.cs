using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Dtos.AppUserDTOS;
using StudyHub.Backend.Api.Dtos.ClassDTOS;
using StudyHub.Backend.Api.Dtos.ClassworkDTOS;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Services;
using System.Linq;

namespace StudyHub.Backend.Api.Mappers
{
    public static class ClassMapper
    {   
       
        public static ClassListDto ToListClassDto(this Class c, AppUser? t) => new ClassListDto
        {
            Id = c.Id,
            Name = c.Name,
            InstructorName = t?.Fullname ?? "Không rõ",
            Description = c.Description,
            Grade = c.Grade,
            CreateAt=c.CreatedAt,

        };

        public static Class ToEntity(this CreateClassDto dto)
        {
            return new Class
            {
                Name = dto.Name,
                Description = dto.Description,
                Grade = dto.Grade,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = dto.CreatedBy
            };
        }
        public static Class ToEntity(this EditClassDto dto)
        {
            return new Class
            {
                Name = dto.Name,
                Description = dto.Description,
                Grade = dto.Grade,
                UpdatedAt = DateTime.UtcNow
            };
        }
        public static ClassDetailDto ToDetailDto(this Class c) => new ClassDetailDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            Grade = c.Grade,
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
                Description = c.Description,
                CreatedAt = c.CreatedAt,
                Notifications = notifications
            };
        }

        public static MemberDto ToMemberDto(this AppUserClass member, AppUser? user, List<AppRole> roles, School school, Commune commune)
        {
            return new MemberDto
            {
                UserId = member.UserId,
                Fullname = user?.Fullname ?? "Không rõ",
                JoinDate = member.JoinDate,
                Email = user.Email,
                Roles = roles.Select(a => a.Name).ToList(),
                Gender = user.Gender,
                SchoolId = user.SchoolId,
                CommuneId = user.CommuneId,
                Address = user.Address,
                PhoneNumber = user.PhoneNumber,
                Wallet = user.Wallet,
                SchoolName = school != null ? school.Name : "",
                Communes = commune != null ? commune.Name : ""
            };
        }

        // Notification mapping (unified)
        public static NotificationDto ToNotificationDto(this ClassNotification noti)
        {
            return new NotificationDto
            {
                Id = noti.Id,
                ClassId = noti.ClassId,
                Title = noti.Title,
                Description = noti.Description,
                CreatedBy = noti.CreatedBy,
                AppUserId = noti.CreatedBy,
                CreatedAt = noti.CreatedAt,
                Type = noti.Type,
                Deadline = noti.Deadline,
                MaxScore = noti.MaxScore,
                AllowSubmission = noti.AllowSubmission
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
                CreatedAt = entity.CreatedAt,
                Files = files ?? new List<FileDto>(),
                Comments = comments ?? new List<CommentDto>(),
                Arthur = user?.Fullname,
                AppUserId=user.Id,
                Avatar = user?.Avatar,
                Type = entity.Type,
                Deadline = entity.Deadline,
                MaxScore = entity.MaxScore,
                AllowSubmission = entity.AllowSubmission
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
                UserId = comment.CreatedBy,
                Content = comment.Content,
                CreatedAt = comment.CreatedAt,
                UserFullname = user?.Fullname ?? "Unknown",
                ImageUrl = user?.Avatar
            };
        }

        public static SubmissionFileDto ToSubmissionDto(this NotificationSubmission sub, List<SubmissionFile> files, AppUser? user )
        {
            return new SubmissionFileDto
            {
                Id = sub.Id,
                NotificationId = sub.NotificationId,
                AppUserId = sub.AppUserId,
                FirstSubmissionTime = sub.FirstSubmissionTime,
                LatestSubmissionTime = sub.LatestSubmissionTime,
                SubmissionFiles = files,
                Score = sub.Score,
                GradedAt = sub.GradedAt,
                GradedBy = sub.GradedBy,
                GradeByName = user!=null? user.Fullname : "Unknown",
                Feedback = sub.Feedback,
                SubmissionStatus = sub.SubmissionStatus
            };
        }
    }
}