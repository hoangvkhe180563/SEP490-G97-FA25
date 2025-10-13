using StudyHub.Backend.Domain;
using StudyHub.Backend.Infrastructure;
using StudyHub.Backend.UseCases;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddUseCasesDependency()
                .AddInfrastructureDependency(builder.Configuration.GetConnectionString("value") ?? "");
//Để chỉnh cái connection string, chuột phải project chọn Manage user secrets.

var app = builder.Build();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();