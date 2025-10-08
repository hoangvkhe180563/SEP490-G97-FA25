using Microsoft.Extensions.DependencyInjection;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddUseCasesDependency(this IServiceCollection services)
        {
            services.AddScoped<AppUserService>();
            return services;
        }
    }
}
