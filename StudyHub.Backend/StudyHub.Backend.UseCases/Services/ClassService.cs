using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace StudyHub.Backend.UseCases.Services
{
    public class ClassService
    {
        private readonly IClassRepository _classRepository;
        private readonly ICloudinaryRepository _fileStorage;
        private readonly AuthService _authService;
        private readonly IAppUserRepository _userRepository;
        private readonly SmtpEmailService _emailService;

        public ClassService(IClassRepository classRepository, ICloudinaryRepository fileStorage, IAppUserRepository userRepository, AuthService authService, SmtpEmailService emailService)
        {
            _classRepository = classRepository;
            _fileStorage = fileStorage;
            _authService = authService;
            _userRepository = userRepository;
            _emailService = emailService;
        }

        // --- Classes listing with filtering + paging ---
        // Returns domain Class list and paging metadata; no Api DTOs used here.
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

        public Class CreateClass(Class dto)
        {
            var entity = new Class
            {
                Name = dto.Name.Trim(),
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = dto.CreatedBy
            };

            return _classRepository.CreateClass(entity);
        }

        public Class UpdateClass(Class dto) => _classRepository.UpdateClass(dto);

       
        public Class? UpdateClassFromPrimitives(int id, string? name, string? description, Guid? updatedBy)
        {
            var existing = _classRepository.GetClassById(id);
            if (existing == null) return null;
            if (!string.IsNullOrWhiteSpace(name)) existing.Name = name;
            existing.Description = description;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.UpdatedBy = updatedBy;
            return _classRepository.UpdateClass(existing);
        }

        public Class GetClassById(int id) => _classRepository.GetClassById(id);
        public Class? GetClassDetail(int id) => _classRepository.GetClassDetailById(id);
       

        // --- Classwork / Submission flow ---
      

        
    }
}