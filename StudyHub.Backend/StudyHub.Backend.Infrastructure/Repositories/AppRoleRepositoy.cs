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
            var result = new List<Domain.Entities.AppRole>();

            var infraUser = _context.AppUsers
                .Include(u => u.Roles)
                .FirstOrDefault(u => u.Id == userId);

            if (infraUser == null) return result;

            foreach (var r in infraUser.Roles)
            {
                var roleDomain = new Domain.Entities.AppRole
                {
                    Id = r.Id,
                    Name = r.Name
                };

                var policies = _context.AppPolicies
                    .Where(p => p.RoleId == r.Id)
                    .Include(p => p.Resource)
                    .ToList();

                foreach (var p in policies)
                {
                    roleDomain.AppPolicies.Add(new Domain.Entities.AppPolicy
                    {
                        RoleId = p.RoleId,
                        ResourceId = p.ResourceId,
                        ActionType = p.ActionType,
                        Condition = p.Condition,
                        Description = p.Description,
                        Resource = new Domain.Entities.AppResource
                        {
                            Id = p.Resource != null ? p.Resource.Id : p.ResourceId,
                            Name = p.Resource != null ? p.Resource.Name ?? string.Empty : string.Empty,
                            ResourceType = p.Resource != null ? p.Resource.ResourceType ?? string.Empty : string.Empty
                        }
                    });
                }

                result.Add(roleDomain);
            }

            return result;
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
                        Id = p.Resource != null ? p.Resource.Id : p.ResourceId,
                        Name = p.Resource != null ? p.Resource.Name ?? string.Empty : string.Empty,
                        ResourceType = p.Resource != null ? p.Resource.ResourceType ?? string.Empty : string.Empty
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
