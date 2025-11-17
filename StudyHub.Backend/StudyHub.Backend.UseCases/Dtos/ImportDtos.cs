using System;
using System.Collections.Generic;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class ImportResultDto
    {
        public int TotalRows { get; set; }
        public int Imported { get; set; }
        public int Failed { get; set; }
        // Generic errors that are not tied to a single field
        public List<string> Errors { get; set; } = new();

        // Field-level errors: key = field name, value = list of error messages (each should include row info)
        public Dictionary<string, List<string>> FieldErrors { get; set; } = new();
    }

    // Note: request DTO for API is defined in API project to avoid coupling service layer to HTTP types.
}
