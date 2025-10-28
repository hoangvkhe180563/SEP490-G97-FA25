using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class AppRoleService
    {
        public IAppRoleRepository _roleRepository;
        private readonly IConfiguration _configuration;
        private const int SALT_ROUNDS = 12; // BCrypt salt rounds for hashing

        public AppRoleService(IAppRoleRepository roleRepository, IConfiguration configuration)
        {
            _roleRepository = roleRepository;
            _configuration = configuration;
        }

        public List<AppRole> GetRolesByUser(Guid userId)
        {
            return _roleRepository.GetRolesForUser(userId).ToList();
        }

        public AppRole? GetRoleByName(string roleName)
        {
            return _roleRepository.GetRoleByName(roleName);
        }

        public List<AppRole> GetAllRoles(string? search = null)
        {
            return _roleRepository.GetAllRoles(search).ToList();
        }

        public AppRole? GetRoleById(Guid roleId)
        {
            return _roleRepository.GetRoleById(roleId);
        }

        public List<AppPolicy> GetPoliciesForRole(Guid roleId)
        {
            return _roleRepository.GetPoliciesForRole(roleId).ToList();
        }

        public void UpdateRolePolicies(Guid roleId, List<AppPolicy> addPolicies, List<(int ResourceId, string ActionType)> removeKeys)
        {
            if (addPolicies != null && addPolicies.Any())
            {
                _roleRepository.AddPoliciesToRole(roleId, addPolicies);
            }
            if (removeKeys != null && removeKeys.Any())
            {
                _roleRepository.RemovePoliciesFromRole(roleId, removeKeys);
            }
        }
    }
}
