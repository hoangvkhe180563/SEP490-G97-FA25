using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Dtos.AppUserDTOS;
using StudyHub.Backend.Api.Dtos.ClassDTOS;
using StudyHub.Backend.Api.Dtos.ClassworkDTOS;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Services;
using System.Linq;
using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Api.Mappers
{
    public static class ClassMapper
    {
        public static ClassListDto ToListClassDto(this Class c, AppUser? t) => new ClassListDto
        {
            Id = c.Id,
            Name = c.Name ?? string.Empty,
            InstructorName = t?.Fullname ?? "Không rõ",
            Description = c.Description ?? string.Empty,
            Grade = c.Grade,
            CreateAt = c.CreatedAt,
        };

        public static Class ToEntity(this CreateClassDto dto)
        {
            return new Class
            {
                Name = dto.Name ?? string.Empty,
                Description = dto.Description ?? string.Empty,
                Grade = dto.Grade,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = dto.CreatedBy
            };
        }
        public static Class ToEntity(this EditClassDto dto)
        {
            return new Class
            {
                Name = dto.Name ?? string.Empty,
                Description = dto.Description ?? string.Empty,
                Grade = dto.Grade,
                UpdatedAt = DateTime.UtcNow
            };
        }
        public static ClassDetailDto ToDetailDto(this Class c) => new ClassDetailDto
        {
            Id = c.Id,
            Name = c.Name ?? string.Empty,
            Description = c.Description ?? string.Empty,
            Grade = c.Grade,
            CreatedAt = c.CreatedAt,
            CreatedBy = c.CreatedBy,
            UpdatedAt = c.UpdatedAt,
            UpdatedBy = c.UpdatedBy,
            DeletedAt = c.DeletedAt,
        };

        public static ClassPostDTO ToFullDetailDto(
           this Class c,
           List<NotificationDto>? notifications)
        {
            return new ClassPostDTO
            {
                Id = c.Id,
                Name = c.Name ?? string.Empty,
                Description = c.Description ?? string.Empty,
                Grade = c.Grade,
                CreatedAt = c.CreatedAt,
                Notifications = notifications ?? new List<NotificationDto>()
            };
        }

        // Note: accept nullable lists and nullable commune to avoid null assignment warnings
        public static MemberDto ToMemberDto(this AppUserClass member, AppUser? user, List<AppRole>? roles, School? school, Commune? commune)
        {
            var safeRoles = roles ?? new List<AppRole>();
            var roleNames = safeRoles.Select(a => a?.Name ?? string.Empty)
                                     .Where(n => !string.IsNullOrWhiteSpace(n))
                                     .ToList();

            return new MemberDto
            {
                UserId = member.UserId,
                Fullname = user?.Fullname ?? "Không rõ",
                JoinDate = member.JoinDate,
                Email = user?.Email ?? string.Empty,
                Roles = roleNames,
                Gender = user?.Gender,
                SchoolId = user?.SchoolId,
                CommuneId = user?.CommuneId,
                Address = user?.Address ?? string.Empty,
                PhoneNumber = user?.PhoneNumber,
                Wallet = user?.Wallet ?? 0,
                SchoolName = school?.Name ?? string.Empty,
                Communes = commune?.Name ?? string.Empty
            };
        }

        // Notification mapping (unified)
        public static NotificationDto ToNotificationDto(this ClassNotification noti)
        {
            return new NotificationDto
            {
                Id = noti.Id,
                ClassId = noti.ClassId,
                Title = noti.Title ?? string.Empty,
                Description = noti.Description ?? string.Empty,
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
              AppUser? user,
             List<FileDto>? files = null,
             List<CommentDto>? comments = null
            )
        {
            var safeFiles = files ?? new List<FileDto>();
            var safeComments = comments ?? new List<CommentDto>();

            return new NotificationDto
            {
                Id = entity.Id,
                ClassId = entity.ClassId,
                Title = entity.Title ?? string.Empty,
                Description = entity.Description ?? string.Empty,
                CreatedBy = entity.CreatedBy,
                CreatedAt = entity.CreatedAt,
                Files = safeFiles,
                Comments = safeComments,
                Arthur = user?.Fullname ?? string.Empty,
                AppUserId = user?.Id ?? Guid.Empty,
                Avatar = user?.Avatar ?? string.Empty,
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
                FileName = file.FileName ?? string.Empty,
                FileUrl = file.FileUrl ?? string.Empty
            };
        }

        public static CommentDto ToCommentDto(this ClassNotificationComment comment, AppUser? user)
        {
            return new CommentDto
            {
                Id = comment.Id,
                NotificationId = comment.NotificationId,
                UserId = comment.CreatedBy,
                Content = comment.Content ?? string.Empty,
                CreatedAt = comment.CreatedAt,
                UserFullname = user?.Fullname ?? "Unknown",
                ImageUrl = user?.Avatar ?? string.Empty
            };
        }

        public static SubmissionFileDto ToSubmissionDto(this NotificationSubmission sub, List<SubmissionFile>? files, AppUser? user)
        {
            return new SubmissionFileDto
            {
                Id = sub.Id,
                NotificationId = sub.NotificationId,
                AppUserId = sub.AppUserId,
                FirstSubmissionTime = sub.FirstSubmissionTime,
                LatestSubmissionTime = sub.LatestSubmissionTime,
                SubmissionFiles = files ?? new List<SubmissionFile>(),
                Score = sub.Score,
                GradedAt = sub.GradedAt,
                GradedBy = sub.GradedBy,
                GradeByName = user?.Fullname ?? "Unknown",
                Feedback = sub.Feedback ?? string.Empty,
                SubmissionStatus = sub.SubmissionStatus
            };
        }
    }
}