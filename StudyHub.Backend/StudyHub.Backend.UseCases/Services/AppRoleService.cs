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
    }
}
