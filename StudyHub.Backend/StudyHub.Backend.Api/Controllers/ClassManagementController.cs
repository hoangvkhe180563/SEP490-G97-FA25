using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.ClassStatisticDTOS;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.UseCases.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;

namespace StudyHub.Backend.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClassManagementController : ControllerBase
    {
        private readonly ClassManagementService _service;
        private readonly AppUserService _appUserService;
        private readonly ClassService _classService;

        public ClassManagementController(ClassManagementService service, AppUserService appUserService, ClassService classService)
        {
            _service = service ?? throw new ArgumentNullException(nameof(service));
            _appUserService = appUserService ?? throw new ArgumentNullException(nameof(appUserService));
            _classService= classService ?? throw new ArgumentNullException( nameof(classService));
        }
        [HttpGet("my-school")]
        public IActionResult MySchool()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null)
                return Unauthorized(new { success = false, message = "Unauthorized" });

            if (!Guid.TryParse(claim.Value, out var userGuid))
                return Unauthorized(new { success = false, message = "Invalid user identifier" });

            var school = _service.GetSchool(userGuid);
            return Ok(school.Name);
        }
        [HttpGet("get-all-class")]
        public IActionResult GetClasses(
         [FromQuery] string? query,
         [FromQuery] string? status,
         [FromQuery] int page = 1,
         [FromQuery] int limit = 10
     )
        {
            if (User.FindFirst(ClaimTypes.NameIdentifier) == null)
            {
                return Unauthorized(new { success = false, message = "Unauthorized" });
            }
            var userGuid = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            // Controller: validation + mapping only
            var (classesEntities, totalItems, currentPage, pageLimit, totalPages) = _service.GetClassesPaged(query, status, userGuid, page, limit);

            var classListDtos = classesEntities
                .Select(c =>
                {
                    var teacher = _classService.GetTeachers().FirstOrDefault(t => t.Id == c.CreatedBy);
                    return c.ToListClassDto(teacher);
                })
                .ToList();

            var response = new
            {
                success = true,
                message = "Danh sách lớp học được tải thành công.",
                classes = classListDtos,
                meta = new
                {
                    total = totalItems,
                    page = currentPage,
                    limit = pageLimit,
                    totalPages = totalPages
                }
            };

            return Ok(response);
        }
        private (bool Success, int? SchoolId, IActionResult? ErrorResult) ResolveSchoolIdFromCurrentUser()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null)
            {
                return (false, null, Unauthorized(new { success = false, message = "Unauthorized" }));
            }

            if (!Guid.TryParse(claim.Value, out var userGuid))
            {
                return (false, null, Unauthorized(new { success = false, message = "Invalid user identifier" }));
            }

            var appUser = _appUserService.GetUserById(userGuid);
            if (appUser == null)
            {
                return (false, null, Unauthorized(new { success = false, message = "User not found" }));
            }

            return (true, appUser.SchoolId, null);
        }

        [HttpGet("overview")]
        public IActionResult Overview()
        {
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var p = _service.GetOverviewPrimitives(resolved.SchoolId);
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
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var data = _service.GetClassesByGradePrimitives(resolved.SchoolId);
            var dto = data.Select(x => new GradeCountDto { Grade = x.Grade, Count = x.Count }).ToList();
            return Ok(dto);
        }

        [HttpGet("students-per-class")]
        public IActionResult StudentsPerClass([FromQuery] int? limit = null)
        {
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var data = _service.GetStudentsPerClassPrimitives(limit, resolved.SchoolId);
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
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var data = _service.GetRoleCountsPrimitives(resolved.SchoolId);
            var dto = data.Select(x => new RoleCountDto { RoleName = x.RoleName, Count = x.Count }).ToList();
            return Ok(dto);
        }

        [HttpGet("gender-ratio")]
        public IActionResult GenderRatio()
        {
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var p = _service.GetGenderRatioPrimitives(resolved.SchoolId);
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
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var p = _service.GetEmailVerifiedPrimitives(resolved.SchoolId);
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
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var data = _service.GetAnnouncementsByTypePrimitives(resolved.SchoolId);
            var dto = data.Select(x => new KeyValueDto { Key = x.Type, Value = x.Count }).ToList();
            return Ok(dto);
        }

        [HttpGet("read-rates")]
        public IActionResult ReadRates()
        {
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var data = _service.GetReadRatesPrimitives(resolved.SchoolId);
            var dto = data.Select(x => new KeyValueDto { Key = x.Key, Value = (int)Math.Round(x.Percent) }).ToList();
            return Ok(dto);
        }

        [HttpGet("top-active-classes")]
        public IActionResult TopActiveClasses([FromQuery] int top = 10)
        {
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var data = _service.GetTopActiveClassesPrimitives(top, resolved.SchoolId);
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
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var rate = _service.GetSubmissionRatePrimitives(resolved.SchoolId);
            return Ok(new { Rate = rate });
        }

        [HttpGet("score-distribution")]
        public IActionResult ScoreDistribution()
        {
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var data = _service.GetScoreDistributionPrimitives(resolved.SchoolId);
            var dto = data.Select(x => new ScoreDistributionDto
            {
                Range = x.Range,
                Count = x.Count,
                Pct = x.Pct
            }).ToList();
            return Ok(dto);
        }
        [HttpGet("avg-score-per-class")]
        public IActionResult AvgScorePerClass()
        {
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;

            try
            {
                var data = _service.GetAverageScorePerClassPrimitives(resolved.SchoolId);
                var dto = data.Select(x => new
                {
                    classId = x.ClassId,
                    className = x.ClassName,
                    avgScore = x.AvgScore,
                    submissions = x.Count
                }).ToList();

                return Ok(new { success = true, data = dto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server khi lấy avg score per class.", error = ex.Message });
            }
        }
        [HttpGet("most-interactive-assignments")]
        public IActionResult MostInteractiveAssignments([FromQuery] int top = 10)
        {
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var data = _service.GetMostInteractiveAssignmentsPrimitives(top, resolved.SchoolId);
            var dto = data.Select(x => new AssignmentInteractionDto
            {
                NotificationId = x.NotificationId,
                Title = x.Title,
                CreateBy = x.CreateBy,
                SubmissionsCount = x.SubmissionsCount
            }).ToList();
            return Ok(dto);
        }

        // Monthly endpoints
        [HttpGet("monthly/classworks")]
        public IActionResult ClassworksPerMonth([FromQuery] int months = 12)
        {
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var data = _service.GetClassworksByMonthPrimitives(months, resolved.SchoolId);
            var dto = data.Select(x => new MonthlyCountDto { Month = x.Month, Count = x.Count }).ToList();
            return Ok(dto);
        }

        [HttpGet("monthly/notifications")]
        public IActionResult NotificationsPerMonth([FromQuery] int months = 12)
        {
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var data = _service.GetNotificationsByMonthPrimitives(months, resolved.SchoolId);
            var dto = data.Select(x => new MonthlyCountDto { Month = x.Month, Count = x.Count }).ToList();
            return Ok(dto);
        }

        [HttpGet("monthly/submissions")]
        public IActionResult SubmissionsPerMonth([FromQuery] int months = 12)
        {
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var data = _service.GetSubmissionsByMonthPrimitives(months, resolved.SchoolId);
            var dto = data.Select(x => new MonthlyCountDto { Month = x.Month, Count = x.Count }).ToList();
            return Ok(dto);
        }

        [HttpGet("monthly/new-classes")]
        public IActionResult NewClassesPerMonth([FromQuery] int months = 12)
        {
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var data = _service.GetNewClassesByMonthPrimitives(months, resolved.SchoolId);
            var dto = data.Select(x => new MonthlyCountDto { Month = x.Month, Count = x.Count }).ToList();
            return Ok(dto);
        }

        // Class stats
        [HttpGet("class-stats")]
        public IActionResult ClassStats()
        {
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var data = _service.GetClassStatsPrimitives(resolved.SchoolId);
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
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var data = _service.GetTopReadNotificationsPrimitives(top, resolved.SchoolId);
            var dto = data.Select(x => new NotificationStatDto
            {
                NotificationId = x.NotificationId,
                CreatedBy = x.CreatedBy,
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
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var data = _service.GetMostIgnoredNotificationsPrimitives(top, resolved.SchoolId);
            var dto = data.Select(x => new NotificationStatDto
            {
                NotificationId = x.NotificationId,
                CreatedBy = x.CreatedBy,
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
            var resolved = ResolveSchoolIdFromCurrentUser();
            if (!resolved.Success) return resolved.ErrorResult!;
            var data = _service.GetClassWithMostNotificationsPrimitives(resolved.SchoolId);
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