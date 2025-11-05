using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StudyHub.Backend.Infrastructure.MongoDb.Data;
using StudyHub.Backend.Infrastructure.MongoDb.Data.Repositories;
using StudyHub.Backend.UseCases.Repositories.Exam;

namespace StudyHub.Backend.Infrastructure.MongoDb
{
    public class MongoDbSettings
    {
        public string ConnectionString { get; set; } = null!;
        public string DatabaseName { get; set; } = null!;
    }

    public static class DependencyInjection
    {
        public static IServiceCollection AddMongoDbDependency(this IServiceCollection services, IConfiguration configuration)
        {
            string connectionString = configuration["MongoDb:ConnectionString"] ?? string.Empty;
            string databaseName = configuration["MongoDb:DatabaseName"] ?? string.Empty;

            services.AddSingleton(provider => new MongoDbContext(connectionString, databaseName));

            services.AddScoped<IQuestionRepository, QuestionRepository>();
            return services;
        }
    }
}

