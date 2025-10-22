using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;

namespace StudyHub.Backend.Api.Filters
{
    public class ConditionalModelValidationFilter : IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            // Nếu có flag skip thì bỏ qua kiểm tra ModelState
            if (context.HttpContext.Items.TryGetValue("SkipAuto400", out var flag) && (bool)flag)
                return;

            // Nếu ModelState không hợp lệ => trả về format lỗi chuẩn của ASP.NET Core
            if (!context.ModelState.IsValid)
            {
                var problemDetails = new ValidationProblemDetails(context.ModelState)
                {
                    Type = "https://tools.ietf.org/html/rfc9110#section-15.5.1",
                    Title = "One or more validation errors occurred.",
                    Status = StatusCodes.Status400BadRequest,
                    Instance = context.HttpContext.Request.Path
                };

                // Giống ASP.NET mặc định: thêm traceId
                problemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;

                context.Result = new BadRequestObjectResult(problemDetails);
            }
        }

        public void OnActionExecuted(ActionExecutedContext context) { }
    }
}
