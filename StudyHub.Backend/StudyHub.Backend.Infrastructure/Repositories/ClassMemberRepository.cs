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
    public class ClassMemberRepository: IClassMemberRepository
    {
        private readonly Data.AppDbContext _context;
        public ClassMemberRepository(Data.AppDbContext context)
        {
            _context = context;
        }
        public List<Domain.Entities.AppUserClass> GetClassMembers(int classId)
        {
            var member = _context.AppUserClasses
       .Where(m => m.ClassId == classId && m.Status.Equals("joined"))
       .GroupBy(m => m.UserId)
       .Select(g => g.FirstOrDefault()) 
       .ToList();
            return member.Select(m => new Domain.Entities.AppUserClass
            {
                UserId = m.UserId,
                ClassId = m.ClassId,
                JoinDate = m.JoinDate,
                Status = m.Status,
                User = m.User != null ? new Domain.Entities.AppUser { Id = m.User.Id, Email = m.User.Email, Fullname = m.User.Fullname, Username = m.User.Username } : null,
                Class = m.Class != null ? new Domain.Entities.Class { Id = m.Class.Id, Name = m.Class.Name, Description = m.Class.Description } : null
            }).ToList();
        }
        public bool InviteMember(Guid userId, int classId)
        {
            try
            {
               
                var existing = _context.AppUserClasses.FirstOrDefault(cm => cm.UserId == userId && cm.ClassId == classId);

                if (existing != null)
                {
                    existing.Status = "invited";
                    existing.JoinDate = DateTime.Now;
                    _context.AppUserClasses.Update(existing);

                    _context.SaveChanges();
                    return true;
                }

                // tạo record mới với status invited (JoinDate null)
                var newMember = new Data.AppUserClass
                {
                    UserId = userId,
                    ClassId = classId,
                    JoinDate = DateTime.Now,
                    Status = "invited",
                };
                _context.AppUserClasses.Add(newMember);
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
                var existing = _context.AppUserClasses.FirstOrDefault(cm => cm.UserId == userId && cm.ClassId == classId);
                if (existing == null)
                {
                    // nếu chưa có record (hiếm), tạo record mới với joined
                    var newMemberData = new Data.AppUserClass
                    {
                        UserId = userId,
                        ClassId = classId,
                        JoinDate = DateTime.Now,
                        Status = "joined"
                    };
                    _context.AppUserClasses.Add(newMemberData);
                    _context.SaveChanges();
                    return true;
                }

                // Cập nhật status -> joined và set JoinDate nếu null
                existing.Status = "joined";
                existing.JoinDate = existing.JoinDate;
                _context.AppUserClasses.Update(existing);
                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ClassRepository", "ConfirmMember failed. Inner error: " + ex.Message).LogError();
                return false;
            }
        }
        public bool DeclineMember(Guid userId, int classId)
        {
            try
            {
                var existing = _context.AppUserClasses.FirstOrDefault(cm => cm.UserId == userId && cm.ClassId == classId);
                if (existing == null)
                {
                    return false;
                }

                existing.Status = "";
                _context.AppUserClasses.Update(existing);
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
                var existing = _context.AppUserClasses.FirstOrDefault(cm => cm.UserId == userId && cm.ClassId == classId);
                if (existing == null)
                {
                    // Nếu chưa tồn tại, không cần tạo record; trả về false (không có gì để kick)
                    return false;
                }

                existing.Status = "kicked";
                // Optional: bạn có thể giữ JoinDate để audit hoặc set null
                _context.AppUserClasses.Update(existing);
                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ClassRepository", "KickMember failed. Inner error: " + ex.Message).LogError();
                return false;
            }
        }
    }
}
