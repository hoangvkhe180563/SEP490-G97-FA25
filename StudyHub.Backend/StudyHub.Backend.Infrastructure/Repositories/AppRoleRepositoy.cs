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

        public List<Domain.Entities.AppRole> GetAllRoles(string? search = null)
        {
            var q = _context.AppRoles.AsQueryable();
            if (!string.IsNullOrEmpty(search))
            {
                q = q.Where(r => r.Name != null && r.Name.Contains(search));
            }
            return q.Select(r => new Domain.Entities.AppRole { Id = r.Id, Name = r.Name }).ToList();
        }

        public Domain.Entities.AppRole? GetRoleById(Guid roleId)
        {
            var r = _context.AppRoles.FirstOrDefault(x => x.Id == roleId);
            if (r == null) return null;
            return new Domain.Entities.AppRole { Id = r.Id, Name = r.Name };
        }

        public List<Domain.Entities.AppPolicy> GetPoliciesForRole(Guid roleId)
        {
            var policies = _context.AppPolicies
                .Where(p => p.RoleId == roleId)
                .Include(p => p.Resource)
                .ToList()
                .Select(p => new Domain.Entities.AppPolicy
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
                })
                .ToList();

            return policies;
        }

        public void AddPoliciesToRole(Guid roleId, List<Domain.Entities.AppPolicy> policies)
        {
            foreach (var p in policies)
            {
                // skip if exists (composite PK RoleId+ResourceId)
                var exists = _context.AppPolicies.Any(x => x.RoleId == roleId && x.ResourceId == p.ResourceId);
                if (exists) continue;
                var newP = new Infrastructure.Data.AppPolicy
                {
                    RoleId = roleId,
                    ResourceId = p.ResourceId,
                    ActionType = p.ActionType,
                    Condition = p.Condition,
                    Description = p.Description
                };
                _context.AppPolicies.Add(newP);
            }
            _context.SaveChanges();
        }

        public void RemovePoliciesFromRole(Guid roleId, List<(int ResourceId, string ActionType)> keys)
        {
            foreach (var k in keys)
            {
                var toRemove = _context.AppPolicies.Where(p => p.RoleId == roleId && p.ResourceId == k.ResourceId && p.ActionType == k.ActionType).ToList();
                if (toRemove.Any())
                {
                    _context.AppPolicies.RemoveRange(toRemove);
                }
            }
            _context.SaveChanges();
        }
    }
}
