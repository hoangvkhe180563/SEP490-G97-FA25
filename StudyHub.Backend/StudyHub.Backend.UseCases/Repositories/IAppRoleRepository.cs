using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IAppRoleRepository
    {
        // get roles assigned to a user (a user can have multiple roles)
        public List<AppRole> GetRolesForUser(Guid userId);
        // find role by name
        public AppRole? GetRoleByName(string roleName);
    }
}
