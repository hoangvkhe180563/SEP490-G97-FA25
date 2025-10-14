using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos;

namespace StudyHub.Backend.Api.Mappers
{
    public static class DocumentCategoryMapper
    {
        public static DocumentCategoryDto ToListDto(this DocumentCategory dc) => new DocumentCategoryDto
        {
            Id = dc.Id,
            Name = dc.Name,
        };
    }
}
