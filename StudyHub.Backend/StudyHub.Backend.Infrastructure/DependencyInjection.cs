using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Repositories;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureDependency(this IServiceCollection services, string connectionString)
        {
            services.AddDbContext<AppDbContext>(options => options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

            services.AddScoped<IAppUserRepository, AppUserRepository>();
            services.AddScoped<ICourseRepository, CourseRepository>();
            services.AddScoped<IChapterRepository, ChapterRepository>();
            services.AddScoped<ILessonRepository, LessonRepository>();
            services.AddScoped<ILandingPageRepository, LandingPageRepository>();
            return services;
        }
    }
}
