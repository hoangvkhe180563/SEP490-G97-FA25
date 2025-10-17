using Microsoft.Extensions.DependencyInjection;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddUseCasesDependency(this IServiceCollection services)
        {
            services.AddScoped<AppUserService>();
            services.AddScoped<CourseService>();
            services.AddScoped<LectureService>();
            services.AddScoped<DocumentService>();
            services.AddScoped<CloudFileStorageService>();
            //services.AddScoped<LocalFileStorageService>();
            services.AddScoped<SubjectService>();
            services.AddScoped<DocumentCategoryService>();

            services.AddScoped<LandingPageService>();
            return services;
        }
    }
}
