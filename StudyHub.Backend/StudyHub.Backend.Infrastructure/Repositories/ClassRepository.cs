using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
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
                    Name = classEntity.Name,
                    Description = classEntity.Description,
                    CreatedBy = classEntity.CreatedBy,
                    Grade = classEntity.Grade,
                };
                var addedclass=_context.Classes.Add(classentity);
                _context.SaveChanges();
                classEntity.Id = addedclass.Entity.Id;
                var classSubjectUserEntity = new Data.AppUserClass
                {
                    UserId = classEntity.CreatedBy,
                    ClassId = classEntity.Id,
                    JoinDate = DateTime.Now,
                    Status = "joined"
                };
                _context.AppUserClasses.Add(classSubjectUserEntity);
                _context.SaveChanges();
                return classEntity;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ClassRepository", "Create failed. Inner error: " + ex.Message).LogError();
                return new Class { };
            }

        }


       

        public List<Class> GetAllClasses(Guid? userid)
        {
            if (userid == null)
            {
                return _context.Classes.Include(c => c.AppUserClasses).Where(c => c.DeletedAt == null).Select(c => new Class
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    Grade = c.Grade,
                    CreatedAt = c.CreatedAt,
                    CreatedBy = c.CreatedBy,
                    UpdatedAt = c.UpdatedAt,
                    UpdatedBy = c.UpdatedBy,
                    DeletedAt = c.DeletedAt
                }).OrderByDescending(c => c.CreatedAt).ToList();
            }
            // Chỉ trả về các Class entity
            return _context.Classes.Include(c => c.AppUserClasses).Where(c => c.DeletedAt == null && c.AppUserClasses.FirstOrDefault(b => b.UserId == userid) != null).Select(c => new Class
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Grade = c.Grade,
                CreatedAt = c.CreatedAt,
                CreatedBy = c.CreatedBy,
                UpdatedAt = c.UpdatedAt,
                UpdatedBy = c.UpdatedBy,
                DeletedAt = c.DeletedAt
            }).OrderByDescending(c => c.CreatedAt).ToList();

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
            var teacherRoleIds = _context.AppRoles
                .Where(r => r.Name.Contains("Teacher"))
                .Select(r => r.Id)
                .ToList();

            var teachers = _context.AppUsers
                .Where(u => u.Roles.Any(role => teacherRoleIds.Contains(role.Id)))
                .ToList();

            if (teachers == null || teachers.Count == 0)
                return new List<AppUser>();

            return teachers
                .Select(u => new AppUser
                {
                    Id = u.Id,
                    Email = u.Email,
                    Username = u.Username,
                    Fullname = u.Fullname,
                    Dob = u.Dob,
                    Gender = u.Gender ?? false, // tránh lỗi null
                    SchoolId = u.SchoolId,
                    Address = u.Address,
                    CommuneId = u.CommuneId,
                    PhoneNumber = u.PhoneNumber,
                    Wallet = u.Wallet,
                    IsVerified = u.IsVerified,
                    IsLoginWithGoogle = u.IsLoginWithGoogle,
                    RefreshToken = u.RefreshToken,
                    Status = u.Status,
                    RefreshTokenExpire = u.RefreshTokenExpire,
                    Roles=u.Roles.Select(a=>new AppRole
                    {
                        Id = a.Id,
                        Name=a.Name

                    }).ToList(),
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
                Grade = clas.Grade,
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
            clas.Grade = classEntity.Grade;
            clas.UpdatedAt = classEntity.UpdatedAt;
            clas.UpdatedBy = classEntity.UpdatedBy;

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
                Grade = c.Grade,
                CreatedAt = c.CreatedAt,
                CreatedBy = c.CreatedBy,
                UpdatedAt = c.UpdatedAt,
                UpdatedBy = c.UpdatedBy,
                DeletedAt = c.DeletedAt
            };
        }

        public List<Class> GetClassByUserId(Guid userid)
        {
            var classes = _context.AppUserClasses.Include(a => a.Class).Where(a => a.UserId.Equals(userid)).Select(
                c => new Class
                {
                    Id = c.Class.Id,
                    Name = c.Class.Name,
                    Description = c.Class.Description,
                    Grade = c.Class.Grade,
                    CreatedAt = c.Class.CreatedAt,
                    CreatedBy = c.Class.CreatedBy,
                    UpdatedAt = c.Class.UpdatedAt,
                    UpdatedBy = c.Class.UpdatedBy,
                    DeletedAt = c.Class.DeletedAt
                }).OrderByDescending(c => c.CreatedAt).ToList();
            return classes;
        }
        public List<Class> GetAllClassByUserId(Guid userId)
        {
            try
            {
                var joinedClassIds = _context.Set<Data.AppUserClass>()
                    .Where(usc => usc.UserId == userId && usc.Status == "joined")
                    .Select(usc => usc.ClassId)
                    .Distinct()
                    .ToList();

                var classDetails = _context.Classes
                    .Where(c => c.DeletedAt == null &&
                           (joinedClassIds.Contains(c.Id) || c.CreatedBy == userId))
                    .Distinct()
                    .Select(c => new Class
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Description = c.Description,
                        Grade = c.Grade,
                        CreatedBy = c.CreatedBy,
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt,
                        UpdatedBy = c.UpdatedBy,
                        DeletedAt = c.DeletedAt
                    })
                    .ToList();

                return classDetails;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ClassRepository",
                    "GetClassByUserId failed: " + ex.Message).LogError();
                return new List<Class>();
            }
        }

        public bool HasTeacher(Guid? userid, int classID)
        {
           var teacher = _context.AppUserClasses.FirstOrDefault(a=>a.UserId == userid&&a.ClassId==classID);
            return teacher != null;
        }
        public Class DeleteClass(Class classID)
        {
            var classes = _context.Classes.FirstOrDefault(a => a.Id == classID.Id);
            if (classes == null) { return null; }
            classes.DeletedAt = DateTime.Now;
            classes.UpdatedBy = classID.UpdatedBy;
            classes.UpdatedAt = classID.CreatedAt;

            _context.Classes.Update(classes);
            _context.SaveChanges();
            return new Class
            {
                Id = classID.Id,
                Name = classes.Name,
                Grade = classes.Grade,
                Description= classes.Description,
                CreatedAt= classes.CreatedAt,
                UpdatedAt = classes.UpdatedAt,
                DeletedAt = classes.DeletedAt
                
            };
        }
    }
}
