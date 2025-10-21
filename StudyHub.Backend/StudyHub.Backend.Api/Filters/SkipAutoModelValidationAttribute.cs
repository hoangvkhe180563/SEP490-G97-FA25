using Microsoft.AspNetCore.Mvc.Filters;

namespace StudyHub.Backend.Api.Filters
{
    // Dùng để đánh dấu các action/controller muốn bỏ qua việc tự động validate model
    public class SkipAutoModelValidationAttribute : Attribute, IResourceFilter
    {
        public void OnResourceExecuting(ResourceExecutingContext context)
        {
            // Gắn flag sớm nhất có thể — trước khi model được validate
            context.HttpContext.Items["SkipAuto400"] = true;
        }

        public void OnResourceExecuted(ResourceExecutedContext context) { }
    }
}
