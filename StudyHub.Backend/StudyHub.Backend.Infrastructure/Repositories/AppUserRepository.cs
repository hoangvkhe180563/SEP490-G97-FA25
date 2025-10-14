using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class AppUserRepository : IAppUserRepository
    {
        //implement các thao tác database từ bên UseCases vào đây
        private readonly AppDbContext _context;
        public AppUserRepository(AppDbContext context)
        {
            _context = context;
        }
    private static Domain.Entities.AppUser ToDomain(StudyHub.Backend.Infrastructure.Data.AppUser d)
        {
            return new Domain.Entities.AppUser
            {
                Id = d.Id,
                Email = d.Email,
                PasswordHash = d.PasswordHash,
                Username = d.Username,
                Fullname = d.Fullname,
                SchoolId = d.SchoolId,
                Status = d.Status,
                RoleId = d.RoleId,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt,
                EmailConfirmed = d.EmailConfirmed,
                RefreshToken = d.RefreshToken,
                RefreshTokenExpire = d.RefreshTokenExpire,
                IsLoginWithGoogle = d.IsLoginWithGoogle,
                Address = d.Address,
                CommuneId = d.CommuneId
            };
        }

    private static StudyHub.Backend.Infrastructure.Data.AppUser ToData(Domain.Entities.AppUser d)
        {
            return new StudyHub.Backend.Infrastructure.Data.AppUser
            {
                Id = d.Id,
                Email = d.Email,
                PasswordHash = d.PasswordHash,
                Username = d.Username,
                Fullname = d.Fullname,
                SchoolId = d.SchoolId,
                Status = d.Status,
                RoleId = d.RoleId,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt,
                EmailConfirmed = d.EmailConfirmed,
                RefreshToken = d.RefreshToken,
                RefreshTokenExpire = d.RefreshTokenExpire,
                IsLoginWithGoogle = d.IsLoginWithGoogle,
                Address = d.Address,
                CommuneId = d.CommuneId
            };
        }

        public List<Domain.Entities.AppUser> GetAllUsers()
        {
            try
            {
                Console.WriteLine(_context.Cities.Count());
            }
            catch (Exception ex)
            {
                new InfrastructureException("AppUserRepository", "Cannot connect db. Inner error: " + ex.Message).LogError();
            }
            //return db.appuser.tolist()
            Console.WriteLine("get all user");
            return _context.AppUsers.Select(u => ToDomain(u)).ToList();
        }

        public Domain.Entities.AppUser? GetByEmail(string email)
        {
            var d = _context.AppUsers.FirstOrDefault(u => u.Email == email);
            return d == null ? null : ToDomain(d);
        }

        public Domain.Entities.AppUser? GetById(Guid id)
        {
            var d = _context.AppUsers.Find(id);
            return d == null ? null : ToDomain(d);
        }

        public void CreateUser(Domain.Entities.AppUser user)
        {
            var d = ToData(user);
            _context.AppUsers.Add(d);
            _context.SaveChanges();
        }

        public void UpdateUser(Domain.Entities.AppUser user)
        {
            var existing = _context.AppUsers.Find(user.Id);
            if (existing == null) return;
            // update properties we care about
            existing.Email = user.Email;
            existing.PasswordHash = user.PasswordHash;
            existing.Username = user.Username;
            existing.Fullname = user.Fullname;
            existing.SchoolId = user.SchoolId;
            existing.Status = user.Status;
            existing.RoleId = user.RoleId;
            existing.UpdatedAt = user.UpdatedAt;
            existing.RefreshToken = user.RefreshToken;
            existing.RefreshTokenExpire = user.RefreshTokenExpire;
            existing.EmailConfirmed = user.EmailConfirmed;
            existing.Address = user.Address;
            existing.CommuneId = user.CommuneId;
            _context.AppUsers.Update(existing);
            _context.SaveChanges();
        }

        public List<Domain.Entities.AppRole> GetRolesForUser(Guid userId)
        {
            // Assuming there is a join table or a relation from users to roles.
            // If AppUser.RoleId is the primary role, we still attempt to load that role and any additional roles
            var roles = new List<Domain.Entities.AppRole>();

            // try primary role
            var primaryRole = _context.AppRoles.FirstOrDefault(r => r.Id == _context.AppUsers.Where(u => u.Id == userId).Select(u => u.RoleId).FirstOrDefault());
            if (primaryRole != null)
            {
                roles.Add(new Domain.Entities.AppRole
                {
                    Id = primaryRole.Id,
                    Name = primaryRole.Name
                });
            }

            // load any additional roles via AppClaims.RoleId where applicable (some schemas store role assignments as claims)
            var extraRoleIds = _context.AppClaims.Where(c => c.UserId == userId).Select(c => c.RoleId).Distinct().ToList();
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

            // enrich permissions for each role if available
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

        public List<Domain.Entities.AppClaim> GetClaimsForUser(Guid userId)
        {
            var claims = _context.AppClaims.Where(c => c.UserId == userId).ToList();
            var result = new List<Domain.Entities.AppClaim>();
            foreach (var c in claims)
            {
                result.Add(new Domain.Entities.AppClaim
                {
                    UserId = c.UserId,
                    RoleId = c.RoleId,
                    SubjectId = c.SubjectId,
                    ClassId = c.ClassId,
                    Class = c.Class == null ? null : new Domain.Entities.Class { Id = c.Class.Id, Name = c.Class.Name },
                    Role = c.Role == null ? null : new Domain.Entities.AppRole { Id = c.Role.Id, Name = c.Role.Name },
                    Subject = c.Subject == null ? null : new Domain.Entities.Subject { Id = c.Subject.Id, Name = c.Subject.Name },
                    User = c.User == null ? null : ToDomain(c.User)
                });
            }
            return result;
        }

        public string? GetSchoolName(int? schoolId)
        {
            if (!schoolId.HasValue) return null;
            var s = _context.Schools.Find(schoolId.Value);
            return s?.Name;
        }

        public string? GetCommuneName(int? communeId)
        {
            if (!communeId.HasValue) return null;
            var c = _context.Communes.Find(communeId.Value);
            return c?.Name;
        }
    }
}
