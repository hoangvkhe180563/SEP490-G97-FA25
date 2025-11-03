using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.QADTOS;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.Api.Mappers
{

    public class QAConversationMapper
    {
        // mapping helper
        public static QAConversationResponse MapToDto(QAConversation c)
        {
            return new QAConversationResponse
            {
                Id = c.Id,
                Title = c.Title,
                StudentId = c.Student.Id,
                StudentName = c.Student?.Fullname ?? string.Empty,
                StudentEmail = c.Student?.Email ?? string.Empty,
                StudentUsername = c.Student?.Username ?? string.Empty,
                StudentAvatar = c.Student?.Avatar ?? string.Empty,
                TeacherId = c.Teacher?.Id,
                TeacherName = c.Teacher?.Fullname,
                TeacherEmail = c.Teacher?.Email,
                TeacherUsername = c.Teacher?.Username,
                TeacherAvatar = c.Teacher?.Avatar,
                Type = c.Type,
                IsPaid = c.IsPaid,
                TopicId = c.TopicId,
                TopicName = c.Topic?.Name ?? string.Empty,
                SubjectName = c.Topic?.Subject?.Name ?? string.Empty,
                CreatedAt = c.CreatedAt
            };
        }
    }
}
