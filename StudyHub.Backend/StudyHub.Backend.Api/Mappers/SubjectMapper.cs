using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.Api.Mappers
{
    public static class SubjectMapper
    {
        public static SubjectDto ToListDto(this Subject s) => new SubjectDto
        {
            Id = s.Id,
            Name = s.Name,
        };
    }
}
