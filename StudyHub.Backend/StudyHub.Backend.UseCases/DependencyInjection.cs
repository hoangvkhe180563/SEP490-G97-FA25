using Microsoft.Extensions.DependencyInjection;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.UseCases.Services;
namespace StudyHub.Backend.UseCases
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddUseCasesDependency(this IServiceCollection services)
        {
            services.AddScoped<AppUserService>();
            services.AddScoped<AppRoleService>();
            services.AddScoped<AuthService>();
            services.AddScoped<CourseService>();
            services.AddScoped<LectureService>();
            services.AddScoped<LessonCommentService>();
            services.AddScoped<LessonResourceService>();
            services.AddScoped<DocumentService>();
            services.AddScoped<CloudFileStorageService>();
            //services.AddScoped<LocalFileStorageService>();
            services.AddScoped<SubjectService>();
            services.AddScoped<DocumentCategoryService>();
            services.AddScoped<LocationService>();
            services.AddScoped<ClassService>();
            services.AddScoped<ClassNotificationService>();
            services.AddScoped<ClassMemberService>();
            services.AddScoped<LandingPageService>();
            services.AddScoped<PaymentInfoService>();
            services.AddScoped<PaymentService>();
            services.AddScoped<TransactionService>();
            services.AddScoped<EnrollmentService>();
            services.AddScoped<ProgressService>();
            services.AddScoped<SmtpEmailService>();
            services.AddScoped<QATopicService>();
            services.AddScoped<QAConversationService>();
            services.AddScoped<QAConversationReadService>();
            services.AddScoped<QAMessageService>();
            services.AddScoped<ForumCommentService>();
            services.AddScoped<ForumConfigService>();
            services.AddScoped<ForumModerationService>();
            services.AddScoped<ForumPostService>();
            services.AddScoped<IImageModerationService, ImageDectectService>();
            services.AddScoped<ExamService>();

            return services;
        }
    }
}
