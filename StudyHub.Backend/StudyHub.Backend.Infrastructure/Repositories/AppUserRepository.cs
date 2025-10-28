using System.Data;
using CloudinaryDotNet.Actions;
using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class AppUserRepository : IAppUserRepository
    {
        private readonly AppDbContext _context;

        private const int DEFAULT_PAGE_SIZE = 10;
        private const int DEFAULT_CURRENT_PAGE = 1;

        public AppUserRepository(AppDbContext context)
        {
            _context = context;
        }
        private static Domain.Entities.AppUser ToDomain(Data.AppUser d)
        {
            return new Domain.Entities.AppUser
            {
                Id = d.Id,
                Email = d.Email,
                Gender = d.Gender,
                PasswordHash = d.PasswordHash,
                Username = d.Username,
                Fullname = d.Fullname,
                IsVerified = d.IsVerified,
                SchoolId = d.SchoolId,
                Status = d.Status,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt,
                RefreshToken = d.RefreshToken,
                RefreshTokenExpire = d.RefreshTokenExpire,
                EmailVerificationToken = d.EmailVerificationToken,
                EmailVerificationExpire = d.EmailVerificationExpire,
                ResetPasswordToken = d.ResetPasswordToken,
                ResetPasswordExpire = d.ResetPasswordExpire,
                IsLoginWithGoogle = d.IsLoginWithGoogle,
                Address = d.Address,
                CommuneId = d.CommuneId,
                Avatar = d.Avatar
            };
        }

        private static Data.AppUser ToData(Domain.Entities.AppUser d)
        {
            return new Data.AppUser
            {
                Id = d.Id,
                Email = d.Email,
                PasswordHash = d.PasswordHash,
                Username = d.Username,
                Fullname = d.Fullname,
                IsVerified = d.IsVerified,
                SchoolId = d.SchoolId,
                Status = d.Status,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt,
                RefreshToken = d.RefreshToken,
                RefreshTokenExpire = d.RefreshTokenExpire,
                EmailVerificationToken = d.EmailVerificationToken,
                EmailVerificationExpire = d.EmailVerificationExpire,
                ResetPasswordToken = d.ResetPasswordToken,
                ResetPasswordExpire = d.ResetPasswordExpire,
                IsLoginWithGoogle = d.IsLoginWithGoogle,
                Address = d.Address,
                CommuneId = d.CommuneId,
                Avatar = d.Avatar
            };
        }

        public List<Domain.Entities.AppUser> GetAllUsers()
        {
            try
            {
                return _context.AppUsers.Select(u => ToDomain(u)).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("AppUserRepository", "SearchDocuments failed. Inner error: " + ex.Message).LogError();
                return new List<Domain.Entities.AppUser>();
            }

        }

        public (List<Domain.Entities.AppUser>, int, int, int, int) GetAppUsersBySearchAndFilter(string? status, string? roleId, string? search, int page, int limit)
        {
            try
            {
                var users = _context.AppUsers.AsQueryable();

                if (!string.IsNullOrEmpty(status))
                {
                    if (status.Equals("active", StringComparison.OrdinalIgnoreCase))
                        users = users.Where(u => u.Status == true);
                    else if (status.Equals("inactive", StringComparison.OrdinalIgnoreCase))
                        users = users.Where(u => u.Status == false);
                }

                if (!string.IsNullOrEmpty(roleId))
                {
                    // Parse roleId to Guid
                    if (Guid.TryParse(roleId, out Guid parsedRoleId))
                    {
                        users = users.Where(u => u.AppClaims.Any(c => c.RoleId == parsedRoleId));
                    }
                }

                if (!string.IsNullOrEmpty(search))
                {
                    var q = search.ToLower();
                    users = users.Where(u => (u.Email ?? "").ToLower().Contains(q) || (u.Username ?? "").ToLower().Contains(q) || (u.Fullname ?? "").ToLower().Contains(q));
                }

                var total = users.Count();
                if (page < 1) page = DEFAULT_CURRENT_PAGE;
                if (limit < 1) limit = DEFAULT_PAGE_SIZE;
                var totalPages = (int)Math.Ceiling(total / (double)limit);
                var paged = users.Skip((page - 1) * limit).Take(limit).ToList();
                var result = paged.Select(u => ToDomain(u)).ToList();
                return (result, total, totalPages, page, limit);
            }
            catch (Exception ex)
            {
                new InfrastructureException("AppUserRepository", "GetAppUsersBySearchAndFilter failed. Inner error: " + ex.Message).LogError();
                return (new List<Domain.Entities.AppUser>(), 0, 0, 0, 0);
            }
        }

        public Domain.Entities.AppUser? GetByEmail(string email)
        {
            var d = _context.AppUsers.FirstOrDefault(u => u.Email == email);
            return d == null ? null : ToDomain(d);
        }

        public Domain.Entities.AppUser? GetByUsername(string username)
        {
            var d = _context.AppUsers.FirstOrDefault(u => u.Username == username);
            return d == null ? null : ToDomain(d);
        }

        public Domain.Entities.AppUser? GetById(Guid id)
        {
            var d = _context.AppUsers.Find(id);
            return d == null ? null : ToDomain(d);
        }

        public void CreateUser(Domain.Entities.AppUser user, IEnumerable<Guid>? roleIds = null)
        {
            try
            {
                var d = ToData(user);

                if (d.CreatedBy == Guid.Empty)
                {
                    d.CreatedBy = Guid.Empty;
                }
                if (d.CreatedAt == default)
                {
                    d.CreatedAt = DateTime.UtcNow;
                }

                _context.AppUsers.Add(d);
                _context.SaveChanges();

                if (roleIds != null)
                {
                    try
                    {
                        var existing = _context.AppUsers
                                    .Include(u => u.AppClaims)
                                    .FirstOrDefault(u => u.Id == d.Id);
                        if (existing != null)
                        {
                            var roles = _context.AppRoles.Where(r => roleIds.Contains(r.Id)).ToList();
                            var subjectIds = GetUserSubjectIds(existing.Id); // Có thể null hoặc empty
                            var classIds = GetUserClassIds(existing.Id);
                            if ((subjectIds == null || !subjectIds.Any()) && (classIds == null || !classIds.Any()))
                            {
                                foreach (var r in roles)
                                {
                                    if (!existing.AppClaims.Any(c => c.RoleId == r.Id
                                                                  && c.SubjectId == 0
                                                                  && c.ClassId == 0))
                                    {
                                        var claim = new Data.AppClaim
                                        {
                                            UserId = existing.Id,
                                            RoleId = r.Id,
                                            SubjectId = 0,
                                            ClassId = 0
                                        };
                                        _context.AppClaims.Add(claim);
                                    }
                                }
                            }
                            else
                            {
                                var subjects = (subjectIds == null || !subjectIds.Any()) ? new List<short> { 0 } : subjectIds.Cast<short>().ToList();
                                var classes = (classIds == null || !classIds.Any()) ? new List<int> { 0 } : classIds.Cast<int>().ToList();
                                foreach (var r in roles)
                                {
                                    foreach (var subjectId in subjects)
                                    {
                                        foreach (var classId in classes)
                                        {
                                            if (!existing.AppClaims.Any(c => c.RoleId == r.Id
                                                                          && c.SubjectId == subjectId
                                                                          && c.ClassId == classId))
                                            {
                                                var claim = new Data.AppClaim
                                                {
                                                    UserId = existing.Id,
                                                    RoleId = r.Id,
                                                    SubjectId = subjectId,
                                                    ClassId = classId
                                                };
                                                _context.AppClaims.Add(claim);
                                            }
                                        }
                                    }
                                }
                            }
                            _context.SaveChanges();
                        }
                    }
                    catch (Exception innerEx)
                    {
                        new InfrastructureException("AppUserRepository", "Attach roles failed after creating user. Inner error: " + innerEx.Message).LogError();
                        throw;
                    }
                }
            }
            catch (Exception ex)
            {
                new InfrastructureException("AppUserRepository", "CreateUser failed. Inner error: " + ex.Message).LogError();
                throw; // let higher layers handle the exception
            }
        }

        public void UpdateUser(Domain.Entities.AppUser user, IEnumerable<Guid>? roleIds = null)
        {
            try
            {
                var existing = _context.AppUsers
                                .Include(u => u.AppClaims)
                                .ThenInclude(c => c.Role)
                                .FirstOrDefault(u => u.Id == user.Id);

                if (existing == null) return;

                existing.Email = user.Email;
                existing.PasswordHash = user.PasswordHash;
                existing.Username = user.Username;
                existing.Fullname = user.Fullname;
                existing.Gender = user.Gender;
                existing.SchoolId = user.SchoolId;
                existing.Status = user.Status;
                existing.IsVerified = user.IsVerified;
                existing.UpdatedAt = user.UpdatedAt;
                existing.RefreshToken = user.RefreshToken;
                existing.RefreshTokenExpire = user.RefreshTokenExpire;
                existing.ResetPasswordToken = user.ResetPasswordToken;
                existing.ResetPasswordExpire = user.ResetPasswordExpire;
                existing.EmailVerificationToken = user.EmailVerificationToken;
                existing.EmailVerificationExpire = user.EmailVerificationExpire;
                existing.Address = user.Address;
                existing.CommuneId = user.CommuneId;
                existing.Avatar = user.Avatar;

                if (roleIds != null && roleIds.Any())
                {
                    // Lấy tất cả claims hiện tại của user
                    var existingClaims = _context.AppClaims
                        .Where(c => c.UserId == user.Id)
                        .ToList();

                    // Lấy danh sách các cặp SubjectId-ClassId hiện tại
                    var currentSubjectClassPairs = existingClaims
                        .Select(c => new { c.SubjectId, c.ClassId })
                        .Distinct()
                        .ToList();

                    // Xóa chỉ các claims có RoleId trong danh sách roleIds cần update
                    var claimsToRemove = existingClaims
                        .Where(c => roleIds.Contains(c.RoleId))
                        .ToList();
                    _context.AppClaims.RemoveRange(claimsToRemove);

                    // Thêm lại claims mới với roles từ roleIds
                    foreach (var roleId in roleIds)
                    {
                        foreach (var pair in currentSubjectClassPairs)
                        {
                            var claim = new Data.AppClaim
                            {
                                UserId = user.Id,
                                RoleId = roleId,
                                SubjectId = pair.SubjectId,
                                ClassId = pair.ClassId
                            };
                            _context.AppClaims.Add(claim);
                        }
                    }
                }

                _context.AppUsers.Update(existing);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                new InfrastructureException("AppUserRepository", "UpdateUser failed. Inner error: " + ex.Message).LogError();
                throw;
            }
        }

        public List<Domain.Entities.AppClaim> GetClaimsForUser(Guid userId)
        {
            var claims = _context.AppClaims
                .Where(c => c.UserId == userId)
                .Include(c => c.Class)
                .Include(c => c.Role)
                .Include(c => c.Subject)
                .ToList();
            var result = new List<Domain.Entities.AppClaim>();
            foreach (var c in claims)
            {
                result.Add(new Domain.Entities.AppClaim
                {
                    UserId = c.UserId,
                    RoleId = c.RoleId,
                    SubjectId = c.SubjectId,
                    ClassId = c.ClassId,
                    Class = new Domain.Entities.Class { Id = c.Class.Id, Name = c.Class.Name },
                    Role = new Domain.Entities.AppRole { Id = c.Role.Id, Name = c.Role.Name },
                    Subject = new Domain.Entities.Subject { Id = c.Subject.Id, Name = c.Subject.Name },
                    User = ToDomain(c.User)
                });
            }
            return result;
        }

        public Domain.Entities.AppUser? GetByRefreshToken(string refreshToken)
        {
            var d = _context.AppUsers.FirstOrDefault(u => u.RefreshToken == refreshToken);
            return d == null ? null : ToDomain(d);
        }

        public Domain.Entities.AppUser? GetByResetToken(string resetToken)
        {
            var d = _context.AppUsers.FirstOrDefault(u => u.ResetPasswordToken == resetToken);
            return d == null ? null : ToDomain(d);
        }

        public void UpdateResetToken(Guid userId, string? resetToken, DateTime? expire)
        {
            var existing = _context.AppUsers.Find(userId);
            if (existing == null) return;
            existing.ResetPasswordToken = resetToken;
            existing.ResetPasswordExpire = expire;
            _context.AppUsers.Update(existing);
            _context.SaveChanges();
        }

        public Domain.Entities.AppUser? GetByEmailVerificationToken(string token)
        {
            var d = _context.AppUsers.FirstOrDefault(u => u.EmailVerificationToken == token);
            return d == null ? null : ToDomain(d);
        }

        public void UpdateEmailVerificationToken(Guid userId, string? token, DateTime? expire)
        {
            var existing = _context.AppUsers.Find(userId);
            if (existing == null) return;
            existing.EmailVerificationToken = token;
            existing.EmailVerificationExpire = expire;
            _context.AppUsers.Update(existing);
            _context.SaveChanges();
        }

        // Lấy tất cả SubjectId mà user đã có claims
        private List<short> GetUserSubjectIds(Guid userId)
        {
            var subjectIds = _context.AppClaims
                .Where(c => c.UserId == userId)
                .Select(c => c.SubjectId)
                .Distinct()
                .ToList();

            return subjectIds;
        }

        // Lấy tất cả ClassId mà user đã có claims
        private List<int> GetUserClassIds(Guid userId)
        {
            var classIds = _context.AppClaims
                .Where(c => c.UserId == userId)
                .Select(c => c.ClassId)
                .Distinct()
                .ToList();

            return classIds;
        }

    }
}
