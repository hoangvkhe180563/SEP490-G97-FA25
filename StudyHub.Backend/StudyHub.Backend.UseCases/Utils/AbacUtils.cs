using DynamicExpresso;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Utils
{
    public class AbacUtils
    {
        private readonly Interpreter _interpreter;
        private readonly IAppRoleRepository _roleRepository;
        public AbacUtils(IAppRoleRepository appRoleRepository)
        {
            _interpreter = new Interpreter(InterpreterOptions.Default | InterpreterOptions.LambdaExpressions);
            _interpreter.Reference(typeof(Enumerable));
            _interpreter.Reference(typeof(List<>));
            _roleRepository = appRoleRepository;
        }

        public bool CanAccess(AppUser user, object? resource, string action, string resourceName)
        {
            if (resource == null)
            {
                return false;
            }

            var roles = _roleRepository.GetRolesForUser(user.Id);

            foreach (var role in roles)
            {
                foreach (var policy in role.AppPolicies
                             .Where(p => p.ActionType == action && p.Resource.ResourceType == resourceName))
                {
                    try
                    {
                        var lambda = _interpreter.Parse(policy.Condition,
                            new Parameter("user", typeof(AppUser)),
                            new Parameter("resource", resource.GetType())
                        );

                        var result = lambda.Invoke(user, resource);

                        if (result is bool b && b)
                        {
                            return true;
                        }
                    }
                    catch
                    {
                        continue;
                    }
                }
            }
            return false;
        }

        // Lọc danh sách resource theo quyền
        public IEnumerable<T> FilterAccessibleResources<T>(AppUser user, IEnumerable<T> resources, string action, string resourceName)
        {
            return resources.Where(r => CanAccess(user, r, action, resourceName)).ToList();
        }
    }
}
