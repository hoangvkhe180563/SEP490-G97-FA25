using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Domain.Entities.Notifications;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Repositories.Notifications;
using StudyHub.Backend.UseCases.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Services
{
    public class ClassService
    {
        private readonly IClassRepository _classRepository;
        private readonly ICloudinaryRepository _fileStorage;
        private readonly AuthService _authService;
        private readonly IAppUserRepository _userRepository;
        private readonly SmtpEmailService _emailService;
        private readonly NotificationService _notificationService;
        private readonly INotificationOfClassRepository _notificationOfClassRepository;
        private readonly INotificationRepository _notificationRepository;

        public ClassService(
            IClassRepository classRepository,
            ICloudinaryRepository fileStorage,
            IAppUserRepository userRepository,
            AuthService authService,
            SmtpEmailService emailService,
            NotificationService notificationService,
            INotificationOfClassRepository notificationOfClassRepository,
            INotificationRepository notificationRepository
        )
        {
            _classRepository = classRepository;
            _fileStorage = fileStorage;
            _authService = authService;
            _userRepository = userRepository;
            _emailService = emailService;
            _notificationService = notificationService;
            _notificationOfClassRepository = notificationOfClassRepository;
            _notificationRepository = notificationRepository;
        }

        public (List<Class> Classes, int TotalItems, int Page, int Limit, int TotalPages) GetClassesPaged(string? query, string? status, Guid? memberid, int page = 1, int limit = 10)
        {
            var allClasses = _classRepository.GetAllClasses(memberid);

            var filtered = allClasses
                .Where(c => (string.IsNullOrEmpty(query) || c.Name.Contains(query, StringComparison.OrdinalIgnoreCase)) && c.DeletedAt == null)
                .ToList();

            int totalItems = filtered.Count;
            int totalPages = (int)Math.Ceiling((double)totalItems / Math.Max(1, limit));
            page = Math.Max(1, Math.Min(page, Math.Max(1, totalPages)));

            var paged = filtered.Skip((page - 1) * limit).Take(limit).ToList();

            return (paged, totalItems, page, limit, totalPages);
        }

        public List<Class> GetClassByUserId(Guid userid)
        {
            var allClasses = _classRepository.GetAllClasses(userid);
            return allClasses;
        }

        public List<Subject> GetSubjects() => _classRepository.GetAllSubject();
        public List<AppUser> GetTeachers() => _classRepository.GetAllTeacher();

        public List<AppUser> GetTeachersHomeRoom(Guid user)
        {
            var users = _userRepository.GetById(user);
            var teachers = _classRepository.GetAllTeacher() ?? new List<AppUser>();

            var homeroomTeachers = teachers
                .Where(t => t.SchoolId == users.SchoolId && t.Roles != null && t.Roles.Any(r => string.Equals(r.Name, "Homeroom Teacher", StringComparison.OrdinalIgnoreCase)))
                .ToList();

            return homeroomTeachers;
        }

        private List<AppUser> GetSchoolAdmins(int? schoolId)
        {
            if (!schoolId.HasValue) return new List<AppUser>();
            return _notificationRepository.GetUsersByRoleAndSchool("SchoolAdmin", schoolId) ?? new List<AppUser>();
        }

        private List<AppUser> GetHomeroomTeachers(int? schoolId)
        {
            if (!schoolId.HasValue) return new List<AppUser>();
            return _notificationRepository.GetUsersByRoleAndSchool("Homeroom Teacher", schoolId) ?? new List<AppUser>();
        }

        // Trả về (groupId, maintainerIds, notifications) để controller broadcast
        public async Task<(int GroupId, List<Guid> MaintainerIds, Notification GroupNotif, Notification ActorNotif)?> PrepareNotificationsAsync(Class cls, Guid actorUserId, bool isCreate, CancellationToken ct = default)
        {
            var actor = _userRepository.GetById(actorUserId);
            if (actor == null || !actor.SchoolId.HasValue) return null;

            var schoolId = actor.SchoolId.Value;
            var admins = GetSchoolAdmins(schoolId);
            var homerooms = GetHomeroomTeachers(schoolId);
            var maintainers = admins.Concat(homerooms).DistinctBy(u => u.Id).ToList();
            var maintainerIds = maintainers.Select(u => u.Id).ToList();

            var groupId = await _notificationOfClassRepository.EnsureMaintainerGroupAsync(schoolId, maintainerIds, actorUserId, ct);

            var notifGroup = new Notification
            {
                Title = isCreate ? "Lớp mới được tạo" : "Lớp được cập nhật",
                Body = $"{actor.Fullname ?? "Người dùng"} đã {(isCreate ? "tạo" : "cập nhật")} lớp {cls.Name}",
                TargetType = "Group",
                TargetGroupId = groupId,
                Priority = "High",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = actorUserId
            };
            var savedGroup = await _notificationService.SendNotificationAsync(notifGroup, ct);

            var notifActor = new Notification
            {
                Title = isCreate ? "Tạo lớp thành công" : "Cập nhật lớp thành công",
                Body = $"Lớp: {cls.Name}",
                TargetType = "User",
                TargetUserId = actorUserId,
                Priority = "Normal",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = actorUserId
            };
            var savedActor = await _notificationService.SendNotificationAsync(notifActor, ct);

            return (groupId, maintainerIds, savedGroup, savedActor);
        }

        public Class CreateClass(Class dto)
        {
            var entity = new Class
            {
                Name = dto.Name.Trim(),
                Description = dto.Description,
                Grade = dto.Grade,
                CreatedAt = DateTime.Now,
                CreatedBy = dto.CreatedBy
            };

            return _classRepository.CreateClass(entity);
        }

        public Class UpdateClass(Class dto) => _classRepository.UpdateClass(dto);

        public Class? UpdateClassFromPrimitives(int id, string? name, string? description, Guid? updatedBy, Guid CreateBY)
        {
            var existing = _classRepository.GetClassById(id);
            if (existing == null) return null;
            if (!string.IsNullOrWhiteSpace(name)) existing.Name = name;
            existing.Description = description;
            existing.UpdatedAt = DateTime.Now;
            existing.UpdatedBy = updatedBy;
            existing.CreatedBy = CreateBY;

            return _classRepository.UpdateClass(existing);
        }

        public Class GetClassById(int id) => _classRepository.GetClassById(id);
        public Class? GetClassDetail(int id) => _classRepository.GetClassDetailById(id);

        public Class? DeleteClass(int id, Guid? deletedBy)
        {
            var existing = _classRepository.GetClassById(id);
            if (existing == null) return null;

            existing.DeletedAt = DateTime.Now;
            existing.UpdatedAt = DateTime.Now;
            existing.UpdatedBy = deletedBy;

            var deleted = _classRepository.DeleteClass(existing);
            return deleted;
        }

        // --- Classwork / Submission flow ---
    }
}