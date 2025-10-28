using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.Api.Mappers
{
    public static class AppRoleMapper
    {
        public static RoleDto ToDto(this AppRole role)
        {
            return new RoleDto { Id = role.Id, Name = role.Name };
        }

        public static PolicyDto ToDto(this AppPolicy p)
        {
            return new PolicyDto
            {
                ResourceId = p.ResourceId,
                ActionType = p.ActionType,
                Condition = p.Condition,
                Description = p.Description,
                Resource = p.Resource == null ? null : new ResourceDto { Id = p.Resource.Id, Name = p.Resource.Name, ResourceType = p.Resource.ResourceType }
            };
        }
    }
}
