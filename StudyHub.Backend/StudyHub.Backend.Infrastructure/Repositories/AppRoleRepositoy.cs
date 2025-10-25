using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class AppRoleRepositoy : IAppRoleRepository
    {
        private readonly AppDbContext _context;
        public AppRoleRepositoy(AppDbContext context)
        {
            _context = context;
        }
        public Domain.Entities.AppRole? GetRoleByName(string roleName)
        {
            if (string.IsNullOrEmpty(roleName)) return null;
            var r = _context.AppRoles.FirstOrDefault(x => x.Name == roleName);
            if (r == null) return null;
            return new Domain.Entities.AppRole { Id = r.Id, Name = r.Name };
        }

        public List<Domain.Entities.AppRole> GetRolesForUser(Guid userId)
        {
            var roles = _context.AppClaims
                .Where(ac => ac.UserId == userId)
                .Include(ac => ac.Role)
                .Distinct()
                .Select(ac => new Domain.Entities.AppRole
                {
                    Id = ac.Role.Id,
                    Name = ac.Role.Name
                })
                .ToList();
            foreach (var role in roles)
            {
                var policies = _context.AppPolicies.Where(p => p.RoleId == role.Id).ToList();
                foreach (var p in policies)
                {
                    role.AppPolicies.Add(new Domain.Entities.AppPolicy
                    {
                        RoleId = p.RoleId,
                        ResourceId = p.ResourceId,
                        ActionType = p.ActionType,
                        Condition = p.Condition,
                        Description = p.Description,
                        Resource = new Domain.Entities.AppResource
                        {
                            Id = p.Resource.Id,
                            Name = p.Resource.Name,
                            ResourceType = p.Resource.ResourceType
                        }
                    });
                }
            }

            return roles;
        }
    }
}
