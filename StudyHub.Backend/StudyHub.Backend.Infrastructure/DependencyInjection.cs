using Microsoft.Extensions.DependencyInjection;
using StudyHub.Backend.Infrastructure.Repositories;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureDependency(this IServiceCollection services, string connectionString)
        {
            //services.AddDbContext<AppDbContext>(options => options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

            services.AddScoped<IAppUserRepository, AppUserRepository>();
            return services;
        }
    }
}
