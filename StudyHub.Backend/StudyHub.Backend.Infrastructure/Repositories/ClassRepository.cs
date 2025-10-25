using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class ClassRepository : IClassRepository
    {
        private readonly Data.AppDbContext _context;

        public ClassRepository(Data.AppDbContext context)
        {
            _context = context;
        }
        public Class CreateClass(Class classEntity)
        {
            try
            {
                var classentity = new Data.Class
                {
                    Id = classEntity.Id,
                    Name = classEntity.Name,
                    SubjectId = classEntity.SubjectId,
                    Description = classEntity.Description,
                };
                _context.Classes.Add(classentity);
                _context.SaveChanges();
                return classEntity;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ClassRepository", "Create failed. Inner error: " + ex.Message).LogError();
                return new Class { };
            }

        }


        public bool DeleteClass(int id)
        {
            throw new NotImplementedException();
        }

        public List<Class> GetAllClasses()
        {
            // Chỉ trả về các Class entity
            return _context.Classes.Where(c => c.DeletedAt == null).Select(c => new Class
            {
                Id = c.Id,
                Name = c.Name,
                SubjectId = c.SubjectId,
                Description = c.Description,
                CreatedAt = c.CreatedAt,
                CreatedBy = c.CreatedBy,
                UpdatedAt = c.UpdatedAt,
                UpdatedBy = c.UpdatedBy,
                DeletedAt = c.DeletedAt
            }).ToList();

        }
        public List<Subject> GetAllSubject()
        {
            return _context.Subjects.Select(c => new Subject
            {
                Id = c.Id,
                Name = c.Name
            }).ToList();
        }
        public List<AppUser> GetAllTeacher()
        {
            var teachers = _context.AppClaims
                .Where(c => c.Role.Name.Contains("Teacher"))
                .Select(c => c.User)
                .Distinct()
                .ToList();

            if (teachers == null)
            {
                return new List<AppUser>();
            }

            return teachers
                .Select(infraUser => new AppUser
                {
                    Id = infraUser.Id,
                    Email = infraUser.Email,
                    Username = infraUser.Username,
                    Fullname = infraUser.Fullname,
                    Dob = infraUser.Dob,
                    Gender = (bool)infraUser.Gender,
                    SchoolId = infraUser.SchoolId,
                    Address = infraUser.Address,
                    CommuneId = infraUser.CommuneId,
                    PhoneNumber = infraUser.PhoneNumber,
                    Wallet = infraUser.Wallet,
                    IsVerified = infraUser.IsVerified,
                    IsLoginWithGoogle = infraUser.IsLoginWithGoogle,
                    RefreshToken = infraUser.RefreshToken,
                    Status = infraUser.Status,
                    RefreshTokenExpire = infraUser.RefreshTokenExpire
                })
                .ToList();
        }

        public Class? GetClassById(int id)
        {
            var clas = _context.Classes.FirstOrDefault(c => c.Id == id);
            return clas == null ? null : new Class
            {
                Id = id,
                Name = clas.Name,
                Description = clas.Description,
                SubjectId = clas.SubjectId,
                CreatedAt = clas.CreatedAt,
                CreatedBy = clas.CreatedBy,
                UpdatedAt = clas.UpdatedAt,
                UpdatedBy = clas.UpdatedBy,
                DeletedAt = clas.DeletedAt
            };
        }

        public List<Class> GetClassesByTeacherId(string teacherId)
        {
            throw new NotImplementedException();
        }

        public Class UpdateClass(Class classEntity)
        {
            var clas = _context.Classes.FirstOrDefault(c => c.Id == classEntity.Id);
            clas.Name = classEntity.Name;
            clas.Description = classEntity.Description;
            clas.UpdatedAt = classEntity.UpdatedAt;
            clas.SubjectId = classEntity.SubjectId;

            _context.Classes.Update(clas);
            _context.SaveChanges();
            return classEntity;
        }
        public Class? GetClassDetailById(int id)
        {
            var c = _context.Classes.FirstOrDefault(x => x.Id == id);
            if (c == null) return null;

            return new Class
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                SubjectId = c.SubjectId,
                CreatedAt = c.CreatedAt,
                CreatedBy = c.CreatedBy,
                UpdatedAt = c.UpdatedAt,
                UpdatedBy = c.UpdatedBy,
                DeletedAt = c.DeletedAt
            };
        }

        public List<ClassMember> GetClassMembers(int classId)
        {
            return _context.ClassMembers
                .Where(m => m.ClassId == classId)
                .Select(m => new ClassMember
                {
                    UserId = m.UserId,
                    ClassId = m.ClassId,
                    JoinDate = m.JoinDate
                }).ToList();
        }

        public List<ClassNotification> GetClassNotifications(int classId)
        {
            return _context.ClassNotifications
                .Where(n => n.ClassId == classId)
                .Select(n => new ClassNotification
                {
                    Id = n.Id,
                    ClassId = n.ClassId,
                    Title = n.Title,
                    Description = n.Description
                }).ToList();
        }
        public List<Class> GetClassByUserId(Guid userid)
        {
            return _context.Classes
                .Where(c => c.CreatedBy == userid)
                .Select(c => new Class
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    SubjectId = c.SubjectId,
                    CreatedAt = c.CreatedAt,
                    CreatedBy = c.CreatedBy,
                    UpdatedAt = c.UpdatedAt,
                    UpdatedBy = c.UpdatedBy,
                    DeletedAt = c.DeletedAt
                })
                .ToList();
        }

    }
}
