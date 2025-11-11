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
                Dob = d.Dob,
                Gender = d.Gender,
                PasswordHash = d.PasswordHash,
                Username = d.Username,
                Fullname = d.Fullname,
                IsVerified = d.IsVerified,
                SchoolId = d.SchoolId,
                TransferId = d.TransferId,
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
                Avatar = d.Avatar,
                PhoneNumber = d.PhoneNumber,
                Wallet = d.Wallet,
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
                Dob = d.Dob,
                IsVerified = d.IsVerified,
                SchoolId = d.SchoolId,
                TransferId = d.TransferId,
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
                Avatar = d.Avatar,
                Wallet = d.Wallet
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

        public List<Domain.Entities.AppUser> GetQATeachers()
        {
            try
            {
                var users = _context.AppUsers
                    .Include(u => u.Roles)
                    .Where(u => u.Roles.Any(r => (r.Name ?? "").Contains("Q&A Teacher")))
                    .ToList();

                return users.Select(u => ToDomain(u)).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("AppUserRepository", "GetQATeachers failed. Inner error: " + ex.Message).LogError();
                return new List<Domain.Entities.AppUser>();
            }
        }

        public List<Domain.Entities.AppUser> GetQATeachersBySubject(short subjectId)
        {
            try
            {
                var users = _context.AppUsers
                    .Include(u => u.Roles)
                    .Include(u => u.AppUserSubjectClasses)
                        .ThenInclude(a => a.Subject)
                    .Where(u => u.Roles.Any(r => (r.Name ?? "").Contains("Q&A Teacher"))
                                && u.AppUserSubjectClasses.Any(a => a.SubjectId == subjectId))
                    .ToList();

                return users.Select(u => ToDomain(u)).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("AppUserRepository", "GetQATeachersBySubject failed. Inner error: " + ex.Message).LogError();
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
                        // filter by user's roles (AppClaims table removed)
                        users = users.Where(u => u.Roles.Any(r => r.Id == parsedRoleId));
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
        public Domain.Entities.AppUser? GetByTransferId(int transferId)
        {
            var d = _context.AppUsers.FirstOrDefault(a => a.TransferId == transferId);
            return d == null ? null : ToDomain(d);
        }

        public void CreateUser(Domain.Entities.AppUser user, IEnumerable<Guid>? roleIds = null)
        {
            try
            {
                user.TransferId = GenerateUniqueTransferId();

                var d = ToData(user);

                if (d.CreatedBy == Guid.Empty)
                {
                    d.CreatedBy = Guid.Empty;
                }
                if (d.CreatedAt == default)
                {
                    d.CreatedAt = DateTime.Now;
                }

                _context.AppUsers.Add(d);
                _context.SaveChanges();

                if (roleIds != null)
                {
                    try
                    {
                        // Attach roles to the newly created user (role assignments are global on user)
                        var existing = _context.AppUsers
                                    .Include(u => u.Roles)
                                    .FirstOrDefault(u => u.Id == d.Id);
                        if (existing != null)
                        {
                            var roles = _context.AppRoles.Where(r => roleIds.Contains(r.Id)).ToList();
                            foreach (var r in roles)
                            {
                                if (!existing.Roles.Any(rr => rr.Id == r.Id))
                                {
                                    existing.Roles.Add(r);
                                }
                            }
                            _context.AppUsers.Update(existing);
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
                                .Include(u => u.Roles)
                                .Include(u => u.AppUserSubjectClasses)
                                .FirstOrDefault(u => u.Id == user.Id);

                if (existing == null) return;

                existing.Email = user.Email;
                existing.PasswordHash = user.PasswordHash;
                existing.Username = user.Username;
                existing.Avatar = user.Avatar;
                existing.Fullname = user.Fullname;
                existing.Dob = user.Dob;
                existing.Gender = user.Gender;
                existing.TransferId = user.TransferId;
                existing.SchoolId = user.SchoolId;
                existing.Address = user.Address;
                existing.CommuneId = user.CommuneId;
                existing.PhoneNumber = user.PhoneNumber;
                existing.Wallet = user.Wallet;
                existing.IsVerified = user.IsVerified;
                existing.RefreshToken = user.RefreshToken;
                existing.RefreshTokenExpire = user.RefreshTokenExpire;
                existing.EmailVerificationToken = user.EmailVerificationToken;
                existing.EmailVerificationExpire = user.EmailVerificationExpire;
                existing.ResetPasswordToken = user.ResetPasswordToken;
                existing.ResetPasswordExpire = user.ResetPasswordExpire;
                existing.IsLoginWithGoogle = user.IsLoginWithGoogle;
                existing.Status = user.Status;
                existing.UpdatedAt = user.UpdatedAt;
                existing.Wallet = user.Wallet;

                if (roleIds != null && roleIds.Any())
                {
                    // Update user's global roles (AppClaim removed). We will replace user's roles with the provided set.
                    var roles = _context.AppRoles.Where(r => roleIds.Contains(r.Id)).ToList();
                    // clear existing roles and attach new ones
                    existing.Roles.Clear();
                    foreach (var r in roles)
                    {
                        existing.Roles.Add(r);
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

        public List<Domain.Entities.AppUserSubjectClass> GetClaimsForUser(Guid userId)
        {
            // AppClaim table removed. Build subject-class assignments from AppUsersubjectclass table.
            var assignments = _context.AppUserSubjectClasses
                .Where(a => a.UserId == userId)
                .Include(a => a.Class)
                .Include(a => a.Subject)
                .Include(a => a.User)
                .ToList();

            var result = new List<Domain.Entities.AppUserSubjectClass>();
            foreach (var a in assignments)
            {
                result.Add(new Domain.Entities.AppUserSubjectClass
                {
                    UserId = a.UserId,
                    SubjectId = a.SubjectId,
                    ClassId = a.ClassId,
                    Class = new Domain.Entities.Class { Id = a.Class.Id, Name = a.Class.Name },
                    Subject = new Domain.Entities.Subject { Id = a.Subject.Id, Name = a.Subject.Name },
                    User = ToDomain(a.User)
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
            var subjectIds = _context.AppUserSubjectClasses
                .Where(a => a.UserId == userId)
                .Select(a => a.SubjectId)
                .Distinct()
                .ToList();

            return subjectIds;
        }

        // Lấy tất cả ClassId mà user đã có claims
        private List<int> GetUserClassIds(Guid userId)
        {
            var classIds = _context.AppUserSubjectClasses
                .Where(a => a.UserId == userId)
                .Select(a => a.ClassId)
                .Distinct()
                .ToList();

            return classIds;
        }

        public int GenerateUniqueTransferId()
        {
            var random = new Random();
            int transferId;

            do
            {
                transferId = random.Next(100000, 1000000);
            }
            while (_context.AppUsers.Any(u => u.TransferId == transferId));

            return transferId;
        }

    }
}
