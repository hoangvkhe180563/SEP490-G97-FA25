using StudyHub.Backend.Api.Dtos.NotificationDTOS;
using StudyHub.Backend.Domain.Entities.Notifications;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Mappers
{
    public static class NotificationMapper
    {
        // Domain -> DTO (with optional read state)
        public static NotificationDto ToDto(Notification n, NotificationRead? read = null)
        {
            return new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Body = n.Body,
                
                TargetType = n.TargetType,
                TargetRoleId = n.TargetRoleId,
                TargetGroupId = n.TargetGroupId,
                TargetUserId = n.TargetUserId,
                Priority = n.Priority,
                IsActive = n.IsActive,
                ExpiresAt = n.ExpiresAt,
                CreatedAt = n.CreatedAt,
                CreatedBy = n.CreatedBy,
                IsRead = read?.IsRead ?? false,
                ReadAt = read?.ReadAt
            };
        }

        // DTO (create) -> Domain
        public static Notification ToDomain(NotificationCreateDto dto, Guid createdBy)
        {
            return new Notification
            {
                Id = Guid.NewGuid(),
                Title = dto.Title,
                Body = dto.Body,
                
                TargetType = dto.TargetType,
                TargetRoleId = dto.TargetRoleId,
                TargetGroupId = dto.TargetGroupId,
                TargetUserId = dto.TargetUserId,
                Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "Normal" : dto.Priority,
                IsActive = true,
                ExpiresAt = dto.ExpiresAt,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = createdBy,
                Metadata = null
            };
        }

        // Convenience: NotificationWithRead -> DTO
        public static NotificationDto ToDto(NotificationService.NotificationWithRead item)
        {
            return ToDto(item.Notification, item.Read);
        }
    }
}
