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
        public List<AppUserSubjectClass> GetClassMembers(int classId)
        {
            var member = _context.AppUserSubjectClasses
       .Where(m => m.ClassId == classId)
       .GroupBy(m => m.UserId)
       .Select(g => g.FirstOrDefault()) // lấy bản ghi đầu tiên mỗi UserId
       .ToList();
            return member.Select(m => new AppUserSubjectClass
            {
                UserId = m.UserId,
                ClassId = m.ClassId,
                JoinDate = m.JoinDate,
                Status = m.Status,
            }).ToList();
        }
        public bool InviteMember(Guid userId, int classId)
        {
            try
            {
                // Nếu đã có record:
                var existing = _context.AppUserSubjectClasses.FirstOrDefault(cm => cm.UserId == userId && cm.ClassId == classId);

                if (existing != null)
                {
                    // nếu đã joined, không đổi; nếu bị kicked hoặc invited, set lại invited and null JoinDate
                    existing.Status = "invited";
                    existing.JoinDate = DateTime.Now;
                    _context.AppUserSubjectClasses.Update(existing);

                    _context.SaveChanges();
                    return true;
                }

                // tạo record mới với status invited (JoinDate null)
                var newMember = new Data.AppUserSubjectClass
                {
                    UserId = userId,
                    ClassId = classId,
                    JoinDate = DateTime.Now,
                    Status = "invited"
                };
                _context.AppUserSubjectClasses.Add(newMember);
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
                var existing = _context.AppUserSubjectClasses.FirstOrDefault(cm => cm.UserId == userId && cm.ClassId == classId);
                if (existing == null)
                {
                    // nếu chưa có record (hiếm), tạo record mới với joined
                    var newMember = new Data.AppUserSubjectClass
                    {
                        UserId = userId,
                        ClassId = classId,
                        JoinDate = DateTime.UtcNow,
                        Status = "joined"
                    };
                    _context.AppUserSubjectClasses.Add(newMember);
                    _context.SaveChanges();
                    return true;
                }

                // Cập nhật status -> joined và set JoinDate nếu null
                existing.Status = "joined";
                existing.JoinDate = existing.JoinDate;
                _context.AppUserSubjectClasses.Update(existing);
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
                var existing = _context.AppUserSubjectClasses.FirstOrDefault(cm => cm.UserId == userId && cm.ClassId == classId);
                if (existing == null)
                {
                    // Nếu chưa tồn tại, không cần tạo record; trả về false (không có gì để kick)
                    return false;
                }

                existing.Status = "kicked";
                // Optional: bạn có thể giữ JoinDate để audit hoặc set null
                _context.AppUserSubjectClasses.Update(existing);
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
