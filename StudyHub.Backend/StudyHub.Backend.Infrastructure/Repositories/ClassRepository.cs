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
                    CreatedBy = classEntity.CreatedBy,
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
            var teacherRole = _context.AppClaims
                .Include(r => r.User)
                .Include(a=>a.Role)
                .Where(r => r.Role.Name.Equals("Teacher"));

            if (teacherRole == null)
            {
                return new List<AppUser>();
            }

            return teacherRole
                .Select(infraUser => new AppUser 
                {
                    Id = infraUser.User.Id,
                    Email = infraUser.User.Email,
                    Username = infraUser.User.Username,
                    Fullname = infraUser.User.Fullname,
                    Dob = infraUser.User.Dob,
                    Gender = (bool)infraUser.User.Gender,
                    SchoolId = infraUser.User.SchoolId,
                    Address = infraUser.User.Address,
                    CommuneId = infraUser.User.CommuneId,
                    PhoneNumber = infraUser.User.PhoneNumber,
                    Wallet = infraUser.User.Wallet,
                    IsVerified = infraUser.User.IsVerified,
                    IsLoginWithGoogle = infraUser.User.IsLoginWithGoogle,
                    RefreshToken = infraUser.User.RefreshToken,
                    Status = infraUser.User.Status,
                    RefreshTokenExpire = infraUser.User.RefreshTokenExpire
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
                .OrderByDescending(n=>n.CreatedAt)
                .Select(n => new ClassNotification
                {
                    Id = n.Id,
                    ClassId = n.ClassId,
                    Title = n.Title,
                    Description = n.Description,
                    Arthur= n.AppUser.Fullname,
                    Avatar = n.AppUser.Avatar,
                    
                    AppUser = new AppUser
                    {
                        Id = n.AppUser.Id,
                        Email = n.AppUser.Email,
                        Username = n.AppUser.Username,
                        Fullname = n.AppUser.Fullname,
                        Dob = n.AppUser.Dob,
                        Avatar = n.AppUser.Avatar,
                        Address = n.AppUser.Address,
                        PhoneNumber = n.AppUser.PhoneNumber,
                        Status = n.AppUser.Status,
                    },
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
                CreatedAt = DateTime.Now,
                
               
                AppUserId = notification.CreatedBy,
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
                .Include(n=>n.AppUser)
                .OrderByDescending(n => n.Title)
                .Select(n=> new ClassNotification
                {
                    Id = n.Id,
                    ClassId = n.ClassId,
                    Title = n.Title,
                    Description = n.Description,
                    Arthur= n.AppUser.Fullname,
                    Avatar = n.AppUser.Avatar

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
                AppUserId = comment.AppUserId,
                Content = comment.Content,
                
            };
            _context.ClassNotificationComments.Add(com);
            _context.SaveChanges();
            return comment;
        }

        public List<ClassNotificationComment> GetCommentsByNotificationId(int notificationId)
        {
            // Gồm cả comment cha và các reply comment
            var allComments = _context.ClassNotificationComments
                .Include(c=>c.AppUser)
                .Where(c => c.NotificationId == notificationId)
                .OrderBy(c => c.Content)
                .ToList();

            // Nếu muốn, có thể build cây reply ở tầng Service sau này.
            return allComments.Select(a=> new ClassNotificationComment
            {
                Id = a.Id,
                NotificationId = a.NotificationId,
                AppUserId = a.AppUserId,
                Content = a.Content,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                AppUser= new AppUser
                {
                    Id = a.AppUser.Id,
                    Email = a.AppUser.Email,
                    Username = a.AppUser.Username,
                    Fullname = a.AppUser.Fullname,
                    Dob = a.AppUser.Dob,
                    Avatar = a.AppUser.Avatar,
                    Address = a.AppUser.Address,
                    PhoneNumber = a.AppUser.PhoneNumber,
                    Status = a.AppUser.Status,
                }
            }).ToList();
        }

        public ClassNotificationFile CreateSubmissionFile(ClassNotificationFile file)
        {
            var subfile = new Data.ClassNotificationFile
            {
                FileName = file.FileName,
                FileUrl = file.FileUrl,
                NotificationId= file.NotificationId,
            };
            _context.ClassNotificationFiles.Add(subfile);
            _context.SaveChanges();
            file.Id=subfile.Id;
            file.FileName = subfile.FileName;
            file.FileUrl = subfile.FileUrl;
            
            return file;
        }

        public List<ClassNotificationFile> GetFileByNotificationId(int notificationId)
        {
            var noti = _context.ClassNotifications.Include(a => a.ClassNotificationFiles).FirstOrDefault(a => a.Id == notificationId);
            var files = noti.ClassNotificationFiles.Select(a => new ClassNotificationFile
            {
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                NotificationId = a.NotificationId,
                Id = a.Id
            }).ToList();
            return files ;
        }

        public List<Class> GetClassByUserId(Guid userid)
        {
           var classes = _context.ClassMembers.Include(a=>a.Class).Where(a=>a.UserId.Equals(userid)).Select(
               c => new Class
               {
                   Id = c.Class.Id,
                   Name = c.Class.Name,
                   SubjectId = c.Class.SubjectId,
                   Description = c.Class.Description,
                   CreatedAt = c.Class.CreatedAt,
                   CreatedBy = c.Class.CreatedBy,
                   UpdatedAt = c.Class.UpdatedAt,
                   UpdatedBy = c.Class.UpdatedBy,
                   DeletedAt = c.Class.DeletedAt
               }).OrderByDescending(c => c.CreatedAt).ToList();
            return classes ;
        }
    }
}
