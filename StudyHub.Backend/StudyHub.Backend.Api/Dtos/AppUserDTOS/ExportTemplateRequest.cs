using System;

namespace StudyHub.Backend.Api.Dtos.AppUserDTOS
{
    public class ExportTemplateRequest
    {
        // Number of data rows to include in template (default 1000)
        public int Rows { get; set; } = 1000;
    }
}
