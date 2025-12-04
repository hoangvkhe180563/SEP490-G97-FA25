using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.ClassStatisticDTOS;
using StudyHub.Backend.UseCases.Services;
using System;
using System.Collections.Generic;
using System.Linq;

namespace StudyHub.Backend.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClassManagementController : ControllerBase
    {
        private readonly ClassManagementService _service;

        public ClassManagementController(ClassManagementService service)
        {
            _service = service ?? throw new ArgumentNullException(nameof(service));
        }

        [HttpGet("overview")]
        public IActionResult Overview()
        {
            var p = _service.GetOverviewPrimitives();
            var dto = new OverviewDto
            {
                TotalUsers = p.TotalUsers,
                TotalClasses = p.TotalClasses,
                TotalAssignments = p.TotalAssignments,
                TotalAnnouncements = p.TotalAnnouncements
            };
            return Ok(dto);
        }

        [HttpGet("classes-by-grade")]
        public IActionResult ClassesByGrade()
        {
            var data = _service.GetClassesByGradePrimitives();
            var dto = data.Select(x => new GradeCountDto { Grade = x.Grade, Count = x.Count }).ToList();
            return Ok(dto);
        }

        [HttpGet("students-per-class")]
        public IActionResult StudentsPerClass([FromQuery] int? limit)
        {
            var data = _service.GetStudentsPerClassPrimitives(limit);
            var dto = data.Select(x => new StudentsPerClassDto
            {
                ClassId = x.ClassId,
                ClassName = x.ClassName,
                Students = x.Students
            }).ToList();
            return Ok(dto);
        }

        [HttpGet("role-counts")]
        public IActionResult RoleCounts()
        {
            var data = _service.GetRoleCountsPrimitives();
            var dto = data.Select(x => new RoleCountDto { RoleName = x.RoleName, Count = x.Count }).ToList();
            return Ok(dto);
        }

        [HttpGet("gender-ratio")]
        public IActionResult GenderRatio()
        {
            var p = _service.GetGenderRatioPrimitives();
            var dto = new List<KeyValueDto>
            {
                new KeyValueDto { Key = "Male", Value = p.Male },
                new KeyValueDto { Key = "Female", Value = p.Female }
            };
            return Ok(dto);
        }

        [HttpGet("email-verified")]
        public IActionResult EmailVerified()
        {
            var p = _service.GetEmailVerifiedPrimitives();
            var dto = new List<KeyValueDto>
            {
                new KeyValueDto { Key = "Verified", Value = p.Verified },
                new KeyValueDto { Key = "Unverified", Value = p.Unverified }
            };
            return Ok(dto);
        }

        [HttpGet("announcements-by-type")]
        public IActionResult AnnouncementsByType()
        {
            var data = _service.GetAnnouncementsByTypePrimitives();
            var dto = data.Select(x => new KeyValueDto { Key = x.Type, Value = x.Count }).ToList();
            return Ok(dto);
        }

        [HttpGet("read-rates")]
        public IActionResult ReadRates()
        {
            var data = _service.GetReadRatesPrimitives();
            var dto = data.Select(x => new KeyValueDto { Key = x.Key, Value = (int)Math.Round(x.Percent) }).ToList();
            return Ok(dto);
        }

        [HttpGet("top-active-classes")]
        public IActionResult TopActiveClasses([FromQuery] int top = 10)
        {
            var data = _service.GetTopActiveClassesPrimitives(top);
            var dto = data.Select(x => new TopActiveClassDto
            {
                ClassId = x.ClassId,
                ClassName = x.ClassName,
                ActivityScore = x.ActivityScore,
                NotificationsCount = x.NotificationsCount,
                SubmissionsCount = x.SubmissionsCount,
                CommentsCount = x.CommentsCount
            }).ToList();
            return Ok(dto);
        }

        [HttpGet("submission-rate")]
        public IActionResult SubmissionRate()
        {
            var rate = _service.GetSubmissionRatePrimitives();
            return Ok(new { Rate = rate });
        }

        [HttpGet("score-distribution")]
        public IActionResult ScoreDistribution()
        {
            var data = _service.GetScoreDistributionPrimitives();
            var dto = data.Select(x => new ScoreDistributionDto
            {
                Range = x.Range,
                Count = x.Count,
                Pct = x.Pct
            }).ToList();
            return Ok(dto);
        }

        [HttpGet("most-interactive-assignments")]
        public IActionResult MostInteractiveAssignments([FromQuery] int top = 10)
        {
            var data = _service.GetMostInteractiveAssignmentsPrimitives(top);
            var dto = data.Select(x => new AssignmentInteractionDto
            {
                NotificationId = x.NotificationId,
                Title = x.Title,
                SubmissionsCount = x.SubmissionsCount
            }).ToList();
            return Ok(dto);
        }

        // Monthly endpoints now accept optional months query parameter (default 12)
        [HttpGet("monthly/classworks")]
        public IActionResult ClassworksPerMonth([FromQuery] int months = 12)
        {
            var data = _service.GetClassworksByMonthPrimitives(months);
            var dto = data.Select(x => new MonthlyCountDto { Month = x.Month, Count = x.Count }).ToList();
            return Ok(dto);
        }

        [HttpGet("monthly/notifications")]
        public IActionResult NotificationsPerMonth([FromQuery] int months = 12)
        {
            var data = _service.GetNotificationsByMonthPrimitives(months);
            var dto = data.Select(x => new MonthlyCountDto { Month = x.Month, Count = x.Count }).ToList();
            return Ok(dto);
        }

        [HttpGet("monthly/submissions")]
        public IActionResult SubmissionsPerMonth([FromQuery] int months = 12)
        {
            var data = _service.GetSubmissionsByMonthPrimitives(months);
            var dto = data.Select(x => new MonthlyCountDto { Month = x.Month, Count = x.Count }).ToList();
            return Ok(dto);
        }

        [HttpGet("monthly/new-classes")]
        public IActionResult NewClassesPerMonth([FromQuery] int months = 12)
        {
            var data = _service.GetNewClassesByMonthPrimitives(months);
            var dto = data.Select(x => new MonthlyCountDto { Month = x.Month, Count = x.Count }).ToList();
            return Ok(dto);
        }

        // === Per-class aggregated stats ===
        [HttpGet("class-stats")]
        public IActionResult ClassStats()
        {
            var data = _service.GetClassStatsPrimitives();
            var dto = data.Select(x => new ClassStatsDto
            {
                ClassId = x.ClassId,
                ClassName = x.ClassName,
                StudentsCount = x.StudentsCount,
                SubmissionRate = x.SubmissionRate,
                ReadRate = x.ReadRate,
                ClassworksCount = x.ClassworksCount,
                NotificationsCount = x.NotificationsCount,
                TotalSubmissions = x.TotalSubmissions
            }).ToList();
            return Ok(dto);
        }

        [HttpGet("top-read-notifications")]
        public IActionResult TopReadNotifications([FromQuery] int top = 10)
        {
            var data = _service.GetTopReadNotificationsPrimitives(top);
            var dto = data.Select(x => new NotificationStatDto
            {
                NotificationId = x.NotificationId,
                Title = x.Title,
                ReadsCount = x.ReadsCount,
                IgnoredCount = x.IgnoredCount,
                TotalRecipients = x.TotalRecipients,
                SubmissionsCount = x.SubmissionsCount
            }).ToList();
            return Ok(dto);
        }

        [HttpGet("most-ignored-notifications")]
        public IActionResult MostIgnoredNotifications([FromQuery] int top = 10)
        {
            var data = _service.GetMostIgnoredNotificationsPrimitives(top);
            var dto = data.Select(x => new NotificationStatDto
            {
                NotificationId = x.NotificationId,
                Title = x.Title,
                ReadsCount = x.ReadsCount,
                IgnoredCount = x.IgnoredCount,
                TotalRecipients = x.TotalRecipients,
                SubmissionsCount = x.SubmissionsCount
            }).ToList();
            return Ok(dto);
        }

        [HttpGet("class-with-most-notifications")]
        public IActionResult ClassWithMostNotifications()
        {
            var data = _service.GetClassWithMostNotificationsPrimitives();
            if (data == null) return Ok(null);
            var dto = new TopActiveClassDto
            {
                ClassId = data.Value.ClassId,
                ClassName = data.Value.ClassName,
                ActivityScore = 0,
                NotificationsCount = data.Value.NotificationsCount,
                SubmissionsCount = data.Value.SubmissionsCount,
                CommentsCount = data.Value.CommentsCount
            };
            return Ok(dto);
        }
    }
}