using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.QADTOS;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.Api.Mappers
{
    public class QATopicMapper
    {
        public static QATopicResponse MapToDto(QATopic t)
        {
            return new QATopicResponse
            {
                Id = t.Id.ToString(),
                Name = t.Name,
                SubjectId = t.Subject.Id,
                SubjectName = t.Subject?.Name ?? string.Empty,
                Description = t.Description ?? string.Empty,
                IsActive = t.IsActive ?? false
            };
        }
    }
}
