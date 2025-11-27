using System;
using System.Collections.Generic;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Api.Dtos.ClassDTOS.ClassDTOHelper;

namespace StudyHub.Backend.Api.Dtos.ClassDTOS
{
    public class CreateNotificationDto
    {
        // Basic
        public int ClassId { get; set; }
        public string Type { get; set; } = "notification";
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }

        public Guid CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<IFormFile>? Files { get; set; }

        // Raw incoming JSON string (from form-data)
        public string? LinksJson { get; set; }

        // Always-return list (never null)
        public List<LinkItem> Links
        {
            get
            {
                return ParseJson.ParseLinksJson(LinksJson);
            }
        }

        public DateTime? Deadline { get; set; }
        public decimal? MaxScore { get; set; }
        public string? GradeType { get; set; }
        public bool AllowSubmission { get; set; } = false;
        public string? InstructionsHtml { get; set; }

        // ---------- Parsing helper ----------


        public class LinkItem
        {
            public string Url { get; set; } = string.Empty;
            public string? Title { get; set; }
        }
    }
}