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
        public  Class CreateClass(Class classEntity)
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
            catch (Exception ex) {
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
            }).OrderByDescending(c=>c.CreatedAt).ToList();
                
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
            var teacherRole = _context.AppRoles
                .Include(r => r.Users) 
                .FirstOrDefault(r => r.Name.Equals("Teacher"));

            if (teacherRole == null)
            {
                return new List<AppUser>();
            }

            return teacherRole.Users
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
            var clas = _context.Classes.FirstOrDefault(c=>c.Id == id);
            return clas==null?null: new Class
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
            var clas= _context.Classes.FirstOrDefault(c=>c.Id == classEntity.Id); 
            clas.Name= classEntity.Name;
            clas.Description= classEntity.Description;
            clas.UpdatedAt= classEntity.UpdatedAt;
            clas.SubjectId= classEntity.SubjectId;

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
        // ===================== NOTIFICATION =====================
        public ClassNotification CreateNotification(ClassNotification notification)
        {
            var classesnoti = new Data.ClassNotification
            {
                ClassId=notification.ClassId,
                Title= notification.Title,
                Description= notification.Description,
                CreatedAt = notification.CreatedAt,
                DeletedAt = notification.DeletedAt,
                UpdatedAt = notification.UpdatedAt,
                CreatedBy = notification.CreatedBy,
                UpdatedBy = notification.UpdatedBy
            };
            _context.ClassNotifications.Add(classesnoti);
            _context.SaveChanges();
            notification.Id = classesnoti.Id;
            return notification;
        }

        public List<ClassNotification> GetNotificationsByClassId(int classId)
        {
            var nos= _context.ClassNotifications
                .Where(n => n.ClassId == classId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n=> new ClassNotification
                {
                    Id = n.Id,
                    ClassId = n.ClassId,
                    Title = n.Title,
                    Description = n.Description,
                    CreatedAt = n.CreatedAt,
                    DeletedAt = n.DeletedAt,
                    UpdatedAt = n.UpdatedAt,
                    CreatedBy = n.CreatedBy,
                    UpdatedBy = n.UpdatedBy
                });
            return nos.ToList();
        }

        // ===================== COMMENT =====================
        public ClassNotificationComment CreateComment(ClassNotificationComment comment)
        {
            var com = new Data.ClassNotificationComment
            {
                Id = comment.Id,
                NotificationId = comment.NotificationId,
                UserId = comment.UserId,
                Content = comment.Content,
                CreatedBy = comment.CreatedBy,
                UpdatedBy = comment.UpdatedBy,
                CreatedAt = comment.CreatedAt,
                DeletedAt = comment.DeletedAt,
                UpdatedAt = comment.UpdatedAt
            };
            _context.ClassNotificationComments.Add(com);
            _context.SaveChanges();
            return comment;
        }

        public List<ClassNotificationComment> GetCommentsByNotificationId(int notificationId)
        {
            // Gồm cả comment cha và các reply comment
            var allComments = _context.ClassNotificationComments
                .Where(c => c.NotificationId == notificationId)
                .OrderBy(c => c.CreatedAt)
                .ToList();

            // Nếu muốn, có thể build cây reply ở tầng Service sau này.
            return allComments.Select(a=> new ClassNotificationComment
            {
                Id = a.Id,
                NotificationId = a.NotificationId,
                UserId = a.UserId,
                Content = a.Content,
                CreatedBy = a.CreatedBy,
                UpdatedBy = a.UpdatedBy,
                CreatedAt= a.CreatedAt,
                DeletedAt= a.DeletedAt,
                UpdatedAt= a.UpdatedAt
            }).ToList();
        }

        public NotificationFile CreateSubmissionFile(NotificationFile file)
        {
            var subfile = new Data.NotificationFile
            {
                FileName = file.FileName,
                FileUrl = file.FileUrl
            };
            _context.NotificationFiles.Add(subfile);
            _context.SaveChanges();
            file.Id=subfile.Id;
            file.FileName = subfile.FileName;
            file.FileUrl = subfile.FileUrl;
            
            return file;
        }

        public void MapFileToNotification(int notificationId, int fileId)
        {
            var mapping = new Data.ClassNotificationFileMapping
            {
                NotificationId = notificationId,
                FileId = fileId
            };
            _context.ClassNotificationFileMappings.Add(mapping);
            _context.SaveChanges();
        }
        public List<SubmissionFile> GetFilesByNotificationId(int notificationId)
        {
            return _context.ClassNotificationFileMappings
                .Include(m => m.File)
                .Where(m => m.NotificationId == notificationId)
                .Select(m => new SubmissionFile
                {
                    Id = m.File.Id,
                    FileName = m.File.FileName,
                    FileUrl = m.File.FileUrl
                })
                .ToList();
        }

    }
}
