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
            Console.WriteLine(connectionString);
            services.AddDbContext<AppDbContext>(options => options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

            services.AddScoped<IAppUserRepository, AppUserRepository>();
            services.AddScoped<StudyHub.Backend.UseCases.Repositories.ICourseRepository, StudyHub.Backend.Infrastructure.Repositories.CourseRepository>();
            services.AddScoped<StudyHub.Backend.UseCases.Repositories.IChapterRepository, StudyHub.Backend.Infrastructure.Repositories.ChapterRepository>();
            services.AddScoped<StudyHub.Backend.UseCases.Repositories.ILessonRepository, StudyHub.Backend.Infrastructure.Repositories.LessonRepository>();
            return services;
        }
    }
}
