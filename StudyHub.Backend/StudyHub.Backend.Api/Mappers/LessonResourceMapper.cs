using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos.LessonResourceDtos;

namespace StudyHub.Backend.Api.Mappers
{
    public static class LessonResourceMapper
    {
        public static LessonResourceListDto ToListDto(this LessonResource r) => new LessonResourceListDto
        {
            Id = r.Id,
            Url = r.Url
        };

        public static LessonResource ToEntity(this LessonResourceCreateDto dto) => new LessonResource
        {
            Url = dto.Url
        };

        public static LessonResource ToEntity(this LessonResourceUpdateDto dto) => new LessonResource
        {
            Id = dto.Id,
            Url = dto.Url
        };
    }
}
