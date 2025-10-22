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
            var roles = new List<Domain.Entities.AppRole>();

            var primaryRole = _context.AppRoles.Include(r => r.Users).FirstOrDefault(r => r.Users.Any(u => u.Id == userId));
            if (primaryRole != null)
            {
                roles.Add(new Domain.Entities.AppRole
                {
                    Id = primaryRole.Id,
                    Name = primaryRole.Name
                });
            }

            var extraRoleIds = _context.AppClaims
                .Where(c => c.UserId == userId)
                .Select(c => c.RoleId)
                .Distinct()
                .ToList();
            foreach (var rid in extraRoleIds)
            {
                if (roles.Any(r => r.Id == rid)) continue;
                var r = _context.AppRoles.Find(rid);
                if (r == null) continue;
                roles.Add(new Domain.Entities.AppRole
                {
                    Id = r.Id,
                    Name = r.Name
                });
            }

            foreach (var role in roles)
            {
                var perms = _context.AppPermissions.Where(p => p.RoleId == role.Id).ToList();
                foreach (var p in perms)
                {
                    role.AppPermissions.Add(new Domain.Entities.AppPermission
                    {
                        RoleId = p.RoleId,
                        ResourceId = p.ResourceId,
                        ActionId = p.ActionId,
                        Action = p.Action == null ? null : new Domain.Entities.AppAction { Id = p.Action.Id, Name = p.Action.Name },
                        Resource = p.Resource == null ? null : new Domain.Entities.AppResource { Id = p.Resource.Id, Name = p.Resource.Name }
                    });
                }
            }

            return roles;
        }
    }
}
