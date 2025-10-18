using StudyHub.Backend.Api.Middleware;
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
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddSwaggerGen();
var app = builder.Build();
app.UseCors();

//For custom JWT middleware for handle token in cookie
//app.UseWhen(
//    ctx => ctx.Request.Path.StartsWithSegments("/api") &&
//           !ctx.Request.Path.StartsWithSegments("/api/auth") &&
//           !ctx.Request.Path.StartsWithSegments("/swagger"),
//    branch =>
//    {
//        branch.UseMiddleware<JwtMiddleware>(); // chính middleware của bạn
//    }
//);

//Use custom middleware to extract JWT from cookie and set in Authorization header
//JWTBearerHandler automatically validates the token from Authorization header
app.UseMiddleware<JwtCookieMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();