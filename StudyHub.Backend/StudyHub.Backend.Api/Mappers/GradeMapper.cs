using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos;

namespace StudyHub.Backend.Api.Mappers
{
    public static class GradeMapper
    {
        public static GradeDto ToListDto(this Grade g) => new GradeDto
        {
            Id = g.Id,
            Name = g.Name,
        };
    }
}
