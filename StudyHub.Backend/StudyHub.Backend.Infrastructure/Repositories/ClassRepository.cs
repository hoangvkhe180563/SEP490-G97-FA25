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

        public List<Class> GetAllClasses(Guid? userid)
        {
            if(userid == null)
            {
                return _context.Classes.Include(c => c.ClassMembers).Where(c => c.DeletedAt == null).Select(c => new Class
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
                }).OrderByDescending(c => c.CreatedAt).ToList();
            }
            // Chỉ trả về các Class entity
            return _context.Classes.Include(c=>c.ClassMembers).Where(c => c.DeletedAt == null&& c.ClassMembers.FirstOrDefault(b=>b.UserId==userid)!=null).Select(c => new Class
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
                .Where(m => m.ClassId == classId && m.Status.Equals("joined"))
                .Select(m => new ClassMember
                {
                    UserId = m.UserId,
                    ClassId = m.ClassId,
                    JoinDate = m.JoinDate,
                    Status = m.Status,
                }).ToList();
        }

        public List<ClassNotification> GetClassNotifications(int classId)
        {
            return _context.ClassNotifications
                .Where(n => n.ClassId == classId&& n.DeletedAt==null)
                .OrderByDescending(n=>n.CreatedAt)
                .Select(n => new ClassNotification
                {
                    Id = n.Id,
                    ClassId = n.ClassId,
                    Title = n.Title,
                    Description = n.Description,
                    CreatedAt= n.CreatedAt,
                    DeletedAt=n.DeletedAt, 
                    UpdatedAt= n.UpdatedAt,
                    AppUserId = n.AppUserId 
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
                    CreatedAt = n.CreatedAt,
                    DeletedAt = n.DeletedAt,
                    UpdatedAt = n.UpdatedAt,
                    AppUserId = n.AppUserId

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
                DeletedAt = a.DeletedAt,
                UpdatedAt = a.UpdatedAt,
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
        public ClassNotificationComment CommentNoti(ClassNotificationComment comment)
        {
            var commented = new Data.ClassNotificationComment
            {
                NotificationId = comment.NotificationId,
                AppUserId = comment.AppUserId,
                Content = comment.Content,
                CreatedAt = DateTime.Now,
            };
            _context.ClassNotificationComments.Add( commented );
            _context.SaveChanges();
            comment.Id = commented.Id;
            return comment;

        }
        public bool deleteNotification(int id)
        {
            var comment = _context.ClassNotifications.FirstOrDefault(c => c.Id == id);
            if (comment != null)
            {
                comment.DeletedAt= DateTime.Now;
                _context.ClassNotifications.Update(comment);
                _context.SaveChanges();
                return true;
            }
            return false;
        }
        public ClassNotification getNotificationByID(int notificationId)
        {
            var noti = _context.ClassNotifications.FirstOrDefault(c => c.Id == notificationId);
            var noti2 = new ClassNotification
            {
                Id = notificationId,
                ClassId = noti.ClassId,
                Title = noti.Title,
                Description=noti.Description,
                AppUserId=noti.AppUserId,
                DeletedAt = noti.DeletedAt,
                CreatedAt=noti.CreatedAt,
                UpdatedAt=noti.UpdatedAt,
            };
            return noti2;
        }
        public bool InviteMember(Guid userId, int classId)
        {
            try
            {
                // Nếu đã có record:
                var existing = _context.ClassMembers.FirstOrDefault(cm => cm.UserId == userId && cm.ClassId == classId);
                
                if (existing != null)
                {
                    // nếu đã joined, không đổi; nếu bị kicked hoặc invited, set lại invited and null JoinDate
                    existing.Status = "invited";
                    existing.JoinDate = DateTime.Now;
                    _context.ClassMembers.Update(existing);

                    _context.SaveChanges();
                    return true;
                }

                // tạo record mới với status invited (JoinDate null)
                var newMember = new Data.ClassMember
                {
                    UserId = userId,
                    ClassId = classId,
                    JoinDate = DateTime.Now,
                    Status = "invited"
                };
                _context.ClassMembers.Add(newMember);
                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ClassRepository", "InviteMember failed. Inner error: " + ex.Message).LogError();
                return false;
            }
        }

        public bool ConfirmMember(Guid userId, int classId)
        {
            try
            {
                var existing = _context.ClassMembers.FirstOrDefault(cm => cm.UserId == userId && cm.ClassId == classId);
                if (existing == null)
                {
                    // nếu chưa có record (hiếm), tạo record mới với joined
                    var newMember = new Data.ClassMember
                    {
                        UserId = userId,
                        ClassId = classId,
                        JoinDate = DateTime.UtcNow,
                        Status = "joined"
                    };
                    _context.ClassMembers.Add(newMember);
                    _context.SaveChanges();
                    return true;
                }

                // Cập nhật status -> joined và set JoinDate nếu null
                existing.Status = "joined";
                existing.JoinDate = existing.JoinDate;
                _context.ClassMembers.Update(existing);
                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ClassRepository", "ConfirmMember failed. Inner error: " + ex.Message).LogError();
                return false;
            }
        }

        public bool KickMember(Guid userId, int classId)
        {
            try
            {
                var existing = _context.ClassMembers.FirstOrDefault(cm => cm.UserId == userId && cm.ClassId == classId);
                if (existing == null)
                {
                    // Nếu chưa tồn tại, không cần tạo record; trả về false (không có gì để kick)
                    return false;
                }

                existing.Status = "kicked";
                // Optional: bạn có thể giữ JoinDate để audit hoặc set null
                _context.ClassMembers.Update(existing);
                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ClassRepository", "KickMember failed. Inner error: " + ex.Message).LogError();
                return false;
            }
        }

        public List<Classwork> GetClassworks(int classId)
        {
            var classww= _context.Classworks.Where(c=>c.ClassId== classId).Select(a=> new Classwork
            {
                Id = a.Id,
                ClassId = a.ClassId,
                Title = a.Title,
                Description = a.Description,
                Deadline = a.Deadline,
            });
            return classww.ToList();
        }
        public Classwork CreateClasswork(Classwork classwork)
        {
            var entity = new Data.Classwork
            {
                ClassId = classwork.ClassId,
                Title = classwork.Title,
                Description = classwork.Description,
                Deadline = classwork.Deadline
            };
            _context.Classworks.Add(entity);
            _context.SaveChanges();
            classwork.Id = entity.Id; // gán lại Id cho domain model
            return classwork;
        }

        public Classwork EditClasswork(Classwork classwork)
        {
            var entity = _context.Classworks.FirstOrDefault(cw => cw.Id == classwork.Id);
            if (entity == null) return null;
            entity.Title = classwork.Title;
            entity.Description = classwork.Description;
            entity.Deadline = classwork.Deadline;
            _context.Classworks.Update(entity);
            _context.SaveChanges();
            return classwork;
        }
        public ClassworkSubmission SubmitClasswork(ClassworkSubmission submission, List<SubmissionFile> files)
        {
            // Tạo mới submission
            var entity = new Data.ClassworkSubmission
            {
                ClassworkId = submission.ClassworkId,
                AppUserId = submission.AppUserId,
                FirstSubmissionTime = DateTime.Now,
                LatestSubmissionTime = DateTime.Now
            };
            _context.ClassworkSubmissions.Add(entity);
            _context.SaveChanges();

            submission.Id = entity.Id;

            // Lưu file nộp bài
            foreach (var file in files)
            {
                var fileEntity = new Data.SubmissionFile
                {
                    SubmissionId = entity.Id,
                    FileName = file.FileName,
                    FileUrl = file.FileUrl
                };
                _context.SubmissionFiles.Add(fileEntity);
            }
            _context.SaveChanges();
            return submission;
        }
        public ClassworkSubmission ResubmitClasswork(int submissionId, List<SubmissionFile> files)
        {
            var entity = _context.ClassworkSubmissions.FirstOrDefault(s => s.Id == submissionId);
            var file = _context.SubmissionFiles.Where(f=>f.SubmissionId == submissionId).ToList();
            if (entity == null) return null;
            entity.LatestSubmissionTime = DateTime.Now;
            _context.ClassworkSubmissions.Update(entity);
            _context.SubmissionFiles.RemoveRange(file);
            _context.SaveChanges(true);

            foreach (var fil in files)
            {
                var fileEntity = new Data.SubmissionFile
                {
                    SubmissionId = submissionId,
                    FileName = fil.FileName,
                    FileUrl = fil.FileUrl
                };
                _context.SubmissionFiles.Add(fileEntity);
            }
            _context.SaveChanges();
            return new ClassworkSubmission
            {
                Id = submissionId,
                ClassworkId = entity.ClassworkId,
                AppUserId = entity.AppUserId,
                FirstSubmissionTime = entity.FirstSubmissionTime,
                LatestSubmissionTime = entity.LatestSubmissionTime
            };
        }
        public Classwork GetClasswork(int classworkId)
        {

            var cw= _context.Classworks.FirstOrDefault(c=>c.Id == classworkId);
            return new Classwork
            {
                Id = cw.Id,
                ClassId = cw.ClassId,
                Title = cw.Title,
                Description = cw.Description,
                Deadline = cw.Deadline,
            };
        }
        public List<ClassworkSubmission> GetSubmissionsByClassworkId(int classworkId)
        {
           return _context.ClassworkSubmissions.Where(c=>c.ClassworkId == classworkId).Select(a=>
             new ClassworkSubmission
            {
                Id = a.Id,
                ClassworkId=a.ClassworkId,
                AppUserId = a.AppUserId,
                FirstSubmissionTime= a.FirstSubmissionTime,
                LatestSubmissionTime= a.LatestSubmissionTime
            }).ToList();
        }
        public ClassworkSubmission GetSubmissionByUserAndClasswork(int classworkId,Guid userId)
        {
            var cs = _context.ClassworkSubmissions.FirstOrDefault(c=>c.ClassworkId==classworkId&&c.AppUserId==userId);
            if (cs == null) return null;
            return new ClassworkSubmission
            {
                Id = cs.Id,
                ClassworkId = cs.ClassworkId,
                AppUserId = cs.AppUserId,
                FirstSubmissionTime = cs.FirstSubmissionTime,
                LatestSubmissionTime = cs.LatestSubmissionTime
            };
        }
        public SubmissionFile AddSubmissionFile(SubmissionFile file)
        {
            var sf = new Data.SubmissionFile
            {
                SubmissionId = file.SubmissionId,
                Id= file.Id,
                FileName = file.FileName,
                FileUrl = file.FileUrl,
                
            };
            _context.SubmissionFiles.Add(sf);
            _context.SaveChanges();
            file.Id = sf.Id;
            return file;
        }
        public List<SubmissionFile> GetSubmissionFiles(int submissionId)
        {
            var fs = _context.SubmissionFiles.Where(a=>a.SubmissionId==submissionId).Select(b=>new SubmissionFile
            {
                SubmissionId = b.SubmissionId,
                Id= b.Id,
                FileName = b.FileName,
                FileUrl = b.FileUrl,
            });
            return fs.ToList();
        }
        public int GetSubmissionCount(int classworkId)
        {
            var submit = _context.ClassworkSubmissions.Where(c => c.ClassworkId == classworkId).Count();
            return submit;
        }
       public int GetMemberCount(int classworkId)
        {
            var classworkEntity = _context.Classworks
                .Include(c => c.Class)
                .FirstOrDefault(c => c.Id == classworkId);

            if (classworkEntity == null)
                return 0;
            var user = _context.AppClaims.Include(c => c.User).Include(c => c.Role).Where(a=>a.Role.Name.Contains("Student")).ToList();
            var classEntity = _context.ClassMembers.Include(c => c.Class).Include(c=>c.User).Where(c=>c.ClassId== classworkEntity.ClassId).ToList();
            List<Data.ClassMember> members = new List<Data.ClassMember>();
            foreach(Data.ClassMember mb in classEntity)
            {
                if (user.FirstOrDefault(a => a.UserId == mb.UserId) != null && mb.Status.Equals("joined"))
                {
                    members.Add(mb);
                }
            }
            return members.Count();
        }
      

    }
}
