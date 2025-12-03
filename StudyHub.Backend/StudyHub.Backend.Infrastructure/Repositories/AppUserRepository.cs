using System.Data;
using CloudinaryDotNet.Actions;
using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Dtos;
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
                Subjects = d.Subjects != null ? d.Subjects.Select(s => new Domain.Entities.Subject { Id = s.Id, Name = s.Name }).ToList() : new List<Domain.Entities.Subject>()
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
                    .Include(u => u.Subjects)
                    .Where(u => u.Roles.Any(r => (r.Name ?? "").Contains("Q&A Teacher"))
                                && u.Subjects.Any(a => a.Id == subjectId))
                    .ToList();

                return users.Select(u => ToDomain(u)).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("AppUserRepository", "GetQATeachersBySubject failed. Inner error: " + ex.Message).LogError();
                return new List<Domain.Entities.AppUser>();
            }
        }

        public List<Domain.Entities.AppUser> GetTeachers()
        {
            try
            {
                var teacherRoleNames = new[] { "Subject Teacher", "Head of Department Teacher", "Q&A Teacher", "Homeroom Teacher" };
                var users = _context.AppUsers
                            .Include(u => u.Roles)
                            .Where(u => u.Roles.Any(r =>teacherRoleNames.Any(tr =>(r.Name ?? "").ToLower() == tr.ToLower())))
                            .ToList();

                return users.Select(u => ToDomain(u)).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("AppUserRepository", "GetTeachers failed. Inner error: " + ex.Message).LogError();
                return new List<Domain.Entities.AppUser>();
            }
        }

        public (List<Domain.Entities.AppUser>, int, int, int, int) GetAppUsersBySearchAndFilter(string? status, string? roleId, string? search, int page, int limit, Guid myUserId)
        {
            try
            {
                var users = _context.AppUsers.Where(u => u.Id != myUserId).AsQueryable();

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

                // ensure subjects navigation is loaded for list queries so callers can access user.Subjects
                users = users.Include(u => u.Subjects);

                var total = users.Count();
                if (page < 1) page = DEFAULT_CURRENT_PAGE;
                if (limit < 1) limit = DEFAULT_PAGE_SIZE;
                var totalPages = (int)Math.Ceiling(total / (double)limit);
                var paged = users.Skip((page - 1) * limit).Take(limit).OrderBy(u => u.CreatedAt).ToList();
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
            var d = _context.AppUsers
                .Include(u => u.Subjects)
                .FirstOrDefault(u => u.Id == id);
            return d == null ? null : ToDomain(d);
        }
        public Domain.Entities.AppUser? GetByTransferId(int transferId)
        {
            var d = _context.AppUsers.FirstOrDefault(a => a.TransferId == transferId);
            return d == null ? null : ToDomain(d);
        }

        public void CreateUser(Domain.Entities.AppUser user, IEnumerable<Guid>? roleIds = null, IEnumerable<short>? subjectIds = null)
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

                // Attach subjects to the newly created user (if provided)
                if (subjectIds != null && subjectIds.Any())
                {
                    try
                    {
                        var existingUser = _context.AppUsers
                                    .Include(u => u.Subjects)
                                    .FirstOrDefault(u => u.Id == d.Id);
                        if (existingUser != null)
                        {
                            var subjects = _context.Subjects.Where(s => subjectIds.Contains(s.Id)).ToList();
                            foreach (var s in subjects)
                            {
                                if (!existingUser.Subjects.Any(ss => ss.Id == s.Id)) existingUser.Subjects.Add(s);
                            }
                            _context.AppUsers.Update(existingUser);
                            _context.SaveChanges();
                        }
                    }
                    catch (Exception innerEx)
                    {
                        new InfrastructureException("AppUserRepository", "Attach subjects failed after creating user. Inner error: " + innerEx.Message).LogError();
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

        // Create multiple users in a single transaction and attach per-user roles
        public void CreateUsersWithRoles(IEnumerable<(Domain.Entities.AppUser user, IEnumerable<Guid>? roleIds)> usersWithRoles)
        {
            using var transaction = _context.Database.BeginTransaction();
            try
            {
                // Add all users first
                foreach (var (user, _) in usersWithRoles)
                {
                    user.TransferId = GenerateUniqueTransferId();
                    var d = ToData(user);
                    if (d.CreatedBy == Guid.Empty) d.CreatedBy = Guid.Empty;
                    if (d.CreatedAt == default) d.CreatedAt = DateTime.Now;
                    _context.AppUsers.Add(d);
                }

                _context.SaveChanges();

                // Attach roles for each created user
                foreach (var (user, roleIds) in usersWithRoles)
                {
                    if (roleIds == null || !roleIds.Any()) continue;

                    var existing = _context.AppUsers
                                    .Include(u => u.Roles)
                                    .FirstOrDefault(u => u.Id == user.Id);
                    if (existing == null) continue;

                    var roles = _context.AppRoles.Where(r => roleIds.Contains(r.Id)).ToList();
                    foreach (var r in roles)
                    {
                        if (!existing.Roles.Any(rr => rr.Id == r.Id))
                        {
                            existing.Roles.Add(r);
                        }
                    }

                    _context.AppUsers.Update(existing);
                }

                _context.SaveChanges();
                transaction.Commit();
            }
            catch (Exception ex)
            {
                try { transaction.Rollback(); } catch { }
                new InfrastructureException("AppUserRepository", "CreateUsersWithRoles failed. Inner error: " + ex.Message).LogError();
                throw;
            }
        }

        public void UpdateUser(Domain.Entities.AppUser user, IEnumerable<Guid>? roleIds = null, IEnumerable<short>? subjectIds = null)
        {
            try
            {
                var existing = _context.AppUsers
                                .Include(u => u.Roles)
                                .Include(u => u.Subjects)
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

                // Update subjects if provided (replace existing set)
                if (subjectIds != null)
                {
                    existing.Subjects.Clear();
                    if (subjectIds.Any())
                    {
                        var subjects = _context.Subjects.Where(s => subjectIds.Contains(s.Id)).ToList();
                        foreach (var s in subjects)
                        {
                            existing.Subjects.Add(s);
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

        public List<AppUserClaim> GetClaimsForUser(Guid userId)
        {
            var result = new List<AppUserClaim>();

            // 1) class assignments (from AppUserClasses table)
            var classAssignments = _context.AppUserClasses
                .Where(a => a.UserId == userId)
                .Include(a => a.Class)
                .Include(a => a.User)
                .ToList();

            foreach (var a in classAssignments)
            {
                result.Add(new AppUserClaim
                {
                    UserId = a.UserId,
                    ClassId = a.ClassId,
                    SubjectId = 0, // class-only assignment (subject not stored here)
                    Class = a.Class != null ? new Domain.Entities.Class { Id = a.Class.Id, Name = a.Class.Name, Description = a.Class.Description } : null,
                    Subject = null,
                    User = a.User != null ? ToDomain(a.User) : null
                });
            }

            // 2) subjects assigned to the user (many-to-many AppUser.Subjects)
            var userWithSubjects = _context.AppUsers
                .Where(u => u.Id == userId)
                .Include(u => u.Subjects)
                .FirstOrDefault();

            if (userWithSubjects != null && userWithSubjects.Subjects != null)
            {
                foreach (var s in userWithSubjects.Subjects)
                {
                    result.Add(new AppUserClaim
                    {
                        UserId = userId,
                        SubjectId = s.Id,
                        ClassId = 0, // subject-only assignment
                        Class = null,
                        Subject = new Domain.Entities.Subject { Id = s.Id, Name = s.Name },
                        User = ToDomain(userWithSubjects)
                    });
                }
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
        public List<short> GetUserSubjectIds(Guid userId)
        {
            // Subjects are now directly associated to AppUser via many-to-many
            var subjectIds = _context.AppUsers
                .Where(u => u.Id == userId)
                .SelectMany(u => u.Subjects.Select(s => s.Id))
                .Distinct()
                .ToList();

            return subjectIds;
        }

        public List<string> GetUserRoleNames(Guid userId)
        {
            try
            {
                var roles = _context.AppUsers
                    .Where(u => u.Id == userId)
                    .SelectMany(u => u.Roles.Select(r => r.Name ?? string.Empty))
                    .Distinct()
                    .ToList();
                return roles;
            }
            catch (Exception ex)
            {
                new InfrastructureException("AppUserRepository", "GetUserRoleNames failed. Inner error: " + ex.Message).LogError();
                return new List<string>();
            }
        }

        // Lấy tất cả ClassId mà user đã có claims
        private List<int> GetUserClassIds(Guid userId)
        {
            var classIds = _context.AppUserClasses
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
