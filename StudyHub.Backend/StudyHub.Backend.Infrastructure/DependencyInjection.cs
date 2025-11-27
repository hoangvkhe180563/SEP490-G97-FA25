using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Repositories;
using StudyHub.Backend.Infrastructure.Repositories.Exam;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Repositories.Exam;

namespace StudyHub.Backend.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureDependency(this IServiceCollection services, IConfiguration configuration)
        {
            string connectionString = configuration.GetConnectionString("value") ?? "";
            services.AddDbContext<AppDbContext>(options => options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

            services.AddScoped<IAppUserRepository, AppUserRepository>();
            services.AddScoped<IAppUserLoginHistoryRepository, AppUserLoginHistoryRepository>();
            services.AddScoped<ICourseRepository, CourseRepository>();
            services.AddScoped<IChapterRepository, ChapterRepository>();
            services.AddScoped<ILessonRepository, LessonRepository>();
            services.AddScoped<IInteractiveQuestionRepository, InteractiveQuestionRepository>();
            services.AddScoped<IInteractiveResponseRepository, InteractiveResponseRepository>();
            services.AddScoped<ILessonResourceRepository, LessonResourceRepository>();
            services.AddScoped<ILandingPageRepository, LandingPageRepository>();
            services.AddScoped<IDocumentRepository, DocumentRepository>();
            services.AddScoped<ILocationRepository, LocationRepository>();
            services.AddScoped<ISubjectRepository, SubjectRepository>();
            services.AddScoped<IDocumentCategoryRepository, DocumentCategoryRepository>();
            services.AddScoped<IEnrollmentRepository, EnrollmentRepository>();
            services.AddScoped<IProgressRepository, ProgressRepository>();
            services.AddScoped<IClassRepository, ClassRepository>();
            services.AddScoped<IClassMemberRepository, ClassMemberRepository>();
            services.AddScoped<IClassNotificationRepository, ClassNotificationRepository>();
            services.AddScoped<IAppRoleRepository, AppRoleRepositoy>();
            services.AddScoped<IQATopicRepository, QATopicRepository>();
            services.AddScoped<IQAConversationRepository, QAConversationRepository>();
            services.AddScoped<IQAConversationReadRepository, QAConversationReadRepository>();
            services.AddScoped<IQAMessageRepository, QAMessageRepository>();
            services.AddScoped<IQAConversationFileRepository, QAConversationFileRepository>();
            services.AddScoped<IForumCommentRepository, ForumCommentRepository>();
            services.AddScoped<IForumConfigRepository, ForumConfigRepository>();
            services.AddScoped<IForumModerationRepository, ForumModerationRepository>();
            services.AddScoped<IForumPostRepository, ForumPostRepository>();
            services.AddScoped<IExamRepository, ExamRepository>();
            services.AddScoped<IExamResultRepository, ExamResultRepository>();
            services.AddScoped<IAccountRecoveryRequestRepository, AccountRecoveryRequestRepository>();
            services.AddScoped<IStatisticsRepository, StatisticsRepository>();
            services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();

            services.AddScoped<ICloudinaryRepository>(provider =>
            {
                var cloudName = configuration["Cloudinary:CloudName"] ?? "";
                var apiKey = configuration["Cloudinary:ApiKey"] ?? "";
                var apiSecret = configuration["Cloudinary:ApiSecret"] ?? "";

                return new CloudinaryRepository(cloudName, apiKey, apiSecret);
            });

            services.AddScoped<IPaymentInfoRepository, PaymentInfoRepository>();
            services.AddScoped<ITransactionRepository, TransactionRepository>();
            services.AddScoped<IQuestionManagerRepository, QuestionManagerRepository>();

            return services;
        }
    }
}

