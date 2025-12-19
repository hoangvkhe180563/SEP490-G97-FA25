using Microsoft.AspNetCore.Mvc;
using OfficeOpenXml;
using StudyHub.Backend.Api.Filters;
using StudyHub.Backend.Api.Hubs;
using StudyHub.Backend.Api.Middlewares;
using StudyHub.Backend.Infrastructure;
using StudyHub.Backend.Infrastructure.MongoDb;
using StudyHub.Backend.UseCases;
using StudyHub.Backend.UseCases.Utils;
using Microsoft.OpenApi.Models;
using StudyHub.Backend.UseCases.Services;

var builder = WebApplication.CreateBuilder(args);

// --- 1. CONFIG SERVICES ---

builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = JwtUtils.GetTokenValidationParameters(builder.Configuration);
    }).AddGoogle(options =>
    {
        options.ClientId = builder.Configuration.GetValue<string>("Google:ClientId");
        options.ClientSecret = builder.Configuration.GetValue<string>("Google:ClientSecret");
        options.CallbackPath = builder.Configuration.GetValue<string>("Google:CallbackPath") ?? "/auth/google/callback";
    });

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});

builder.Services.AddControllers(options =>
{
    options.Filters.Add<ConditionalModelValidationFilter>();
});

builder.Services.AddUseCasesDependency()
                .AddInfrastructureDependency(builder.Configuration)
                .AddMongoDbDependency(builder.Configuration);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(builder.Configuration.GetSection($"App:BaseUrl:{builder.Environment.EnvironmentName}").Value ?? "")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "StudyHub API", Version = "v1" });
    c.SupportNonNullableReferenceTypes();

    // Cấu hình để upload file trên Swagger
    c.MapType<IFormFile>(() => new OpenApiSchema
    {
        Type = "string",
        Format = "binary"
    });

    // Thêm nút "Authorize" (khóa) để dán JWT Token vào Swagger cho Production/Dev
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] { }
        }
    });
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(20);
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
});

builder.Services.AddSignalR();
builder.Services.AddHostedService(provider =>
    provider.GetRequiredService<ImageModerationBackgroundService>());

ExcelPackage.License.SetNonCommercialPersonal("StudyHub");
builder.Services.AddScoped<ISignalRNotifier, SignalRNotifierMiddleware>();

var app = builder.Build();

// --- 2. CONFIG MIDDLEWARE PIPELINE ---

app.UseCors();

// Bật Swagger cho TẤT CẢ các môi trường (bao gồm cả Production)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "StudyHub API v1");
    // Nếu bạn muốn truy cập thẳng root (/) là ra Swagger luôn thì bỏ comment dòng dưới:
    // c.RoutePrefix = string.Empty; 
});

app.UseHttpsRedirection();

// Middleware xử lý Token từ Cookie (nếu có)
app.UseMiddleware<JwtCookieMiddleware>();

app.UseAuthentication();
app.UseMiddleware<AccountActiveMiddleware>();
app.UseAuthorization();
app.UseSession();

app.MapControllers();

// SignalR Hubs
app.MapHub<ClassNotificationHub>("/hubs/class-notification");
app.MapHub<QAChatHub>("/hubs/qa-chat");
app.MapHub<UserPresenseHub>("/hubs/user-presense");
app.MapHub<ForumHub>("/hubs/forum");
app.MapHub<PaymentHub>("/hubs/payment");
app.MapHub<QAReadHub>("/hubs/qa-read");
app.MapHub<NotificationHub>("/hubs/notification");

app.Run();
