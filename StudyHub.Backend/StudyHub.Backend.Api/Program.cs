using StudyHub.Backend.Domain;
using StudyHub.Backend.Infrastructure;
using StudyHub.Backend.UseCases;
using StudyHub.Backend.UseCases.Utils;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = JwtUtils.GetTokenValidationParameters(builder.Configuration);
    });

builder.Services.AddUseCasesDependency()
                .AddInfrastructureDependency(builder.Configuration);
//Để chỉnh cái connection string, chuột phải project chọn Manage user secrets.

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:3979")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddSwaggerGen();
var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseCors();
app.MapControllers();
app.Run();