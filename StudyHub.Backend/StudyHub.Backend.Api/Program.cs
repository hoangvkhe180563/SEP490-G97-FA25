using StudyHub.Backend.Api.Middleware;
using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Domain;
using StudyHub.Backend.Infrastructure;
using StudyHub.Backend.UseCases;
using StudyHub.Backend.UseCases.Utils;
using StudyHub.Backend.Api.Filters;

var builder = WebApplication.CreateBuilder(args);

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


// Tắt tính năng tự động trả về 400 khi model state không hợp lệ
// Ghi chú rằng ModalStateInvalidFilter là ActionFilter chạy sau khi ModelBinding vì thế muốn custom được phải tắt cái này trên toàn bộ API
// Vì C# không hỗ trợ suppress per action/controller nên ta sẽ tắt toàn bộ và tạo filter riêng để thêm lại
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});

// Tạo ra filter giống với modal state nhưng tuỳ chỉnh thêm vài cái để có thể custome response về như ý mình
// Thứ tự diễn ra các filter là AuthorizeFilter => ResourceFilter => ModelBinding => ActionFilter
// Filter dưới là ActionFilter chạy sau khi ModelBinding
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ConditionalModelValidationFilter>();
});


builder.Services.AddUseCasesDependency()
                .AddInfrastructureDependency(builder.Configuration);
//Để chỉnh cái connection string, chuột phải project chọn Manage user secrets.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:3979", "http://localhost:6789")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
builder.Services.AddSwaggerGen(c =>
{
    c.SupportNonNullableReferenceTypes();

    c.MapType<IFormFile>(() => new Microsoft.OpenApi.Models.OpenApiSchema
    {
        Type = "string",
        Format = "binary"
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
app.UseSession();
app.MapControllers();
app.Run();