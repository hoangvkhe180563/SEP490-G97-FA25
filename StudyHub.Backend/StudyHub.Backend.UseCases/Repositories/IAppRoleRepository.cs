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
        // list all roles, optionally filter by search string (name contains, case-insensitive)
        public List<AppRole> GetAllRoles(string? search = null);
        // find role by id
        public AppRole? GetRoleById(Guid roleId);
        // get policies for a role (including resource info)
        public List<AppPolicy> GetPoliciesForRole(Guid roleId);
        // add policies to a role (skip duplicates)
        public void AddPoliciesToRole(Guid roleId, List<AppPolicy> policies);
        // remove policies from a role by resourceId+actionType
        public void RemovePoliciesFromRole(Guid roleId, List<(int ResourceId, string ActionType)> keys);
    }
}
