using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using System.IO;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;
using StudyHub.Backend.UseCases.Exceptions;

namespace StudyHub.Backend.UseCases.Services
{
    public class AppUserService
    {
        //thực hiện use case ở đây
        //gọi repo để thao tác với database, sau đó xử lý data lấy về từ repo.
        public IAppUserRepository _userRepository;
        public IAppRoleRepository _roleRepository;
        private readonly IConfiguration _configuration;
        private readonly ICloudinaryRepository _cloudinary;
        private const int SALT_ROUNDS = 12; // BCrypt salt rounds for hashing

        public AppUserService(IAppUserRepository userRepository, IAppRoleRepository roleRepository, IConfiguration configuration, StudyHub.Backend.UseCases.Repositories.ICloudinaryRepository cloudinary)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
            _configuration = configuration;
            _cloudinary = cloudinary;
        }

        public PagedResult<AppUserListDto> GetAppUsers(string? status, string? role, string? search, int page, int limit)
        {
            var (users, total, totalPages, pageResult, limitResult) = _userRepository.GetAppUsersBySearchAndFilter(status, role, search, page, limit);

            var items = new List<AppUserListDto>();
            foreach (var u in users)
            {
                var roles = _roleRepository.GetRolesForUser(u.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();

                items.Add(new AppUserListDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    Username = u.Username,
                    Fullname = u.Fullname,
                    Avatar = u.Avatar,
                    Status = (u.Status == true) ? "Active" : "Inactive",
                    CreatedAt = u.CreatedAt.ToString("yyyy/MM/dd"),
                    Roles = roles,
                });
            }

            return new PagedResult<AppUserListDto>
            {
                Items = items,
                Total = total,
                Page = pageResult,
                Limit = limitResult,
                TotalPages = totalPages
            };
        }

        // Return a flat list of QA teachers as AppUserListDto (no paging)
        public List<AppUserListDto> GetQATeachers()
        {
            var users = _userRepository.GetQATeachers();
            var items = new List<AppUserListDto>();
            foreach (var u in users)
            {
                var roles = _roleRepository.GetRolesForUser(u.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
                items.Add(new AppUserListDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    Username = u.Username,
                    Fullname = u.Fullname,
                    Avatar = u.Avatar,
                    Status = (u.Status == true) ? "Active" : "Inactive",
                    CreatedAt = u.CreatedAt.ToString("yyyy/MM/dd"),
                    Roles = roles
                });
            }
            return items;
        }

        // Return QA teachers for a given subject id
        public List<AppUserListDto> GetQATeachersBySubject(short subjectId)
        {
            var users = _userRepository.GetQATeachersBySubject(subjectId);
            var items = new List<AppUserListDto>();
            foreach (var u in users)
            {
                var roles = _roleRepository.GetRolesForUser(u.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
                items.Add(new AppUserListDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    Username = u.Username,
                    Fullname = u.Fullname,
                    Avatar = u.Avatar,
                    Status = (u.Status == true) ? "Active" : "Inactive",
                    CreatedAt = u.CreatedAt.ToString("yyyy/MM/dd"),
                    Roles = roles
                });
            }
            return items;
        }

        // Admin / management methods
        public AppUser? GetUserById(Guid id)
        {
            // Return the domain AppUser and let the API layer map/format the data for clients.
            var user = _userRepository.GetById(id);
            return user;
        }
        public AppUser? GetUserByEmail(string email) => _userRepository.GetByEmail(email);
        public AppUser? GetUserByUsername(string username) => _userRepository.GetByUsername(username);

        // Async create account with optional avatar upload handled here (clean architecture: business logic in service)
        public async Task<AppUser> CreateAccountAsync(string email, string password, string username, IEnumerable<Guid>? roleIds, int communeId, int schoolId, string? fullname = null, DateOnly? dob = null, IFormFile? avatarFile = null, int gender = 0, string? address = null, string? phoneNumber = null)
        {
            Dictionary<string, string> errors = new Dictionary<string, string>();

            var existing = _userRepository.GetByEmail(email);
            if (existing != null) errors.Add("Email", "Email đã tồn tại");

            existing = _userRepository.GetByUsername(username);
            if (existing != null) errors.Add("Username", "Username đã tồn tại");

            string hash = BCrypt.Net.BCrypt.HashPassword(password, SALT_ROUNDS);

            // Validate role combinations before creating user
            if (roleIds != null && roleIds.Any())
            {
                var roleNames = new List<string>();
                foreach (var rid in roleIds)
                {
                    var r = _roleRepository.GetRoleById(rid);
                    if (r != null && !string.IsNullOrEmpty(r.Name)) roleNames.Add(r.Name!);
                }

                bool hasExternal = roleNames.Any(n => string.Equals(n, "External Student", StringComparison.OrdinalIgnoreCase));
                bool hasSchool = roleNames.Any(n => string.Equals(n, "School Student", StringComparison.OrdinalIgnoreCase));

                if (hasExternal && hasSchool)
                {
                    if (errors.ContainsKey("RoleIds")) errors["RoleIds"] = errors["RoleIds"] + " và không thể gán đồng thời vai trò External Student và School Student";
                    else errors.Add("RoleIds", "Không thể gán đồng thời vai trò External Student và School Student");
                }

                var studentRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "External Student", "School Student" };
                var managerRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Teacher", "Manager", "Admin", "Moderator" };
                bool hasStudent = roleNames.Any(n => studentRoles.Contains(n));
                bool hasManager = roleNames.Any(role => managerRoles.Any(keyword => role.Contains(keyword, StringComparison.OrdinalIgnoreCase)));
                if (hasStudent && hasManager)
                {
                    if (errors.ContainsKey("RoleIds")) errors["RoleIds"] = errors["RoleIds"] + " và vai trò học sinh không thể kết hợp với vai trò quản lý (Teacher, Manager, Admin, Moderator)";
                    else errors.Add("RoleIds", "Vai trò học sinh không thể kết hợp với vai trò quản lý (Teacher, Manager, Admin, Moderator)");
                }
            }

            string? uploadedUrl = null;
            if (avatarFile != null && avatarFile.Length > 0)
            {
                // validate
                var ext = Path.GetExtension(avatarFile.FileName)?.ToLowerInvariant();
                if (string.IsNullOrEmpty(ext) || !FileConstants.AllowedImageExtensions.Contains(ext))
                    errors.Add("Avatar", "Định dạng ảnh không được hỗ trợ");
                if (avatarFile.Length > FileConstants.MaxImageSize)
                    errors.Add("Avatar", "Kích thước ảnh vượt quá giới hạn");

                uploadedUrl = await _cloudinary.UploadImageAsync(avatarFile, FileConstants.AvatarUploadPath);
                if (string.IsNullOrEmpty(uploadedUrl)) uploadedUrl = null;
            }


            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = hash,
                Username = username,
                Fullname = fullname,
                Dob = dob,
                CommuneId = communeId == 0 ? null : communeId,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                Status = true,
                Avatar = uploadedUrl,
                Gender = (gender == 1),
                Address = address,
                PhoneNumber = phoneNumber,
                SchoolId = schoolId == 0 ? null : schoolId,
            };
            if (errors.Count > 0)
            {
                throw new InvalidFieldException(errors);
            }

            try
            {
                _userRepository.CreateUser(user, roleIds);
                return user;
            }
            catch (Exception ex)
            {
                // if upload succeeded but DB failed, try to cleanup uploaded image
                if (!string.IsNullOrEmpty(uploadedUrl))
                {
                    try { await _cloudinary.DeleteImageAsync(uploadedUrl); } catch { }
                }
                throw new InvalidOperationException("Failed to create account: " + ex.Message, ex);
            }
        }

        // Async edit account with optional avatar upload and old-avatar deletion
        public async Task<AppUser?> EditAccountAsync(Guid id, string? email = null, string? username = null, string? fullname = null, DateOnly? dob = null, int? communeId = null, bool? status = null, IFormFile? avatarFile = null, int? gender = null, IEnumerable<Guid>? roleIds = null, int? schoolId = null, string? address = null, string? phoneNumber = null)
        {
            Dictionary<string, string> errors = new Dictionary<string, string>();

            var user = _userRepository.GetById(id);
            if (user == null) return null;

            // Validate role combinations for update
            if (roleIds != null && roleIds.Any())
            {
                var roleNames = new List<string>();
                foreach (var rid in roleIds)
                {
                    var r = _roleRepository.GetRoleById(rid);
                    if (r != null && !string.IsNullOrEmpty(r.Name)) roleNames.Add(r.Name!);
                }

                bool hasExternal = roleNames.Any(n => string.Equals(n, "External Student", StringComparison.OrdinalIgnoreCase));
                bool hasSchool = roleNames.Any(n => string.Equals(n, "School Student", StringComparison.OrdinalIgnoreCase));

                if (hasExternal && hasSchool)
                {
                    if (errors.ContainsKey("RoleIds")) errors["RoleIds"] = errors["RoleIds"] + " và không thể gán đồng thời vai trò External Student và School Student";
                    else errors.Add("RoleIds", "Không thể gán đồng thời vai trò External Student và School Student");
                }

                var studentRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "External Student", "School Student" };
                var managerRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Teacher", "Manager", "Admin", "Moderator" };
                bool hasStudent = roleNames.Any(n => studentRoles.Contains(n));
                bool hasManager = roleNames.Any(role => managerRoles.Any(keyword => role.Contains(keyword, StringComparison.OrdinalIgnoreCase)));

                if (hasStudent && hasManager)
                {
                    if (errors.ContainsKey("RoleIds")) errors["RoleIds"] = errors["RoleIds"] + " và vai trò học sinh không thể kết hợp với vai trò quản lý (Teacher, Manager, Admin, Moderator)";
                    else errors.Add("RoleIds", "Vai trò học sinh không thể kết hợp với vai trò quản lý (Teacher, Manager, Admin, Moderator)");
                }
            }

            if (!string.IsNullOrEmpty(email))
            {
                var existing = _userRepository.GetByEmail(email);
                if (existing != null && email != user.Email) errors.Add("Email", "Email đã tồn tại");
                user.Email = email;
            }
            if (!string.IsNullOrEmpty(username))
            {
                var existing = _userRepository.GetByUsername(username);
                if (existing != null && username != user.Username) errors.Add("Username", "Username đã tồn tại");
                user.Username = username;
            }
            if (!string.IsNullOrEmpty(fullname)) user.Fullname = fullname;
            if (dob.HasValue) user.Dob = dob.Value;
            if (communeId.HasValue) user.CommuneId = communeId.Value;
            if (!string.IsNullOrEmpty(address)) user.Address = address;
            if (!string.IsNullOrEmpty(phoneNumber)) user.PhoneNumber = phoneNumber;
            if (schoolId.HasValue) user.SchoolId = schoolId.Value;

            if (status.HasValue) user.Status = status.Value;
            if (gender.HasValue) user.Gender = (gender.Value == 1);
            user.UpdatedAt = DateTime.Now;

            string? oldAvatar = user.Avatar;
            string? uploadedUrl = null;

            if (avatarFile != null && avatarFile.Length > 0)
            {
                var ext = Path.GetExtension(avatarFile.FileName)?.ToLowerInvariant();
                if (string.IsNullOrEmpty(ext) || !FileConstants.AllowedImageExtensions.Contains(ext))
                    errors.Add("Avatar", "Định dạng ảnh không được hỗ trợ");
                if (avatarFile.Length > FileConstants.MaxImageSize)
                    errors.Add("Avatar", "Kích thước ảnh vượt quá giới hạn");

                uploadedUrl = await _cloudinary.UploadImageAsync(avatarFile, FileConstants.AvatarUploadPath);
                if (string.IsNullOrEmpty(uploadedUrl)) uploadedUrl = null;
                user.Avatar = uploadedUrl;
            }
            else if (avatarFile == null)
            {
                user.Avatar = oldAvatar;
            }
            if (errors.Count > 0)
            {
                throw new InvalidFieldException(errors);
            }

            try
            {
                _userRepository.UpdateUser(user, roleIds);

                // after success, if avatar changed and we uploaded a new one, delete old
                if (!string.IsNullOrEmpty(oldAvatar) && !string.IsNullOrEmpty(uploadedUrl) && !string.Equals(oldAvatar, uploadedUrl, StringComparison.OrdinalIgnoreCase))
                {
                    try { await _cloudinary.DeleteImageAsync(oldAvatar); } catch { }
                }

                return user;
            }
            catch (Exception ex)
            {
                // if update failed and we uploaded a new avatar, delete the uploaded to avoid orphan
                if (!string.IsNullOrEmpty(uploadedUrl) && !string.Equals(oldAvatar, uploadedUrl, StringComparison.OrdinalIgnoreCase))
                {
                    try { await _cloudinary.DeleteImageAsync(uploadedUrl); } catch { }
                }
                throw new InvalidOperationException("Cập nhật dữ liệu không thành công: " + ex.Message, ex);
            }
        }
        public async Task<AppUser?> UpdateProfile(AppUser user, string? email = null, string? username = null, string? fullname = null, DateOnly? dob = null, int? communeId = null, string? oldPassword = null, string? newPassword = null, IFormFile? avatarFile = null, int? gender = null, int? schoolId = null, string? address = null, string? phoneNumber = null)
        {
            Dictionary<string, string> errors = new Dictionary<string, string>();

            if (!string.IsNullOrEmpty(email))
            {
                var existing = _userRepository.GetByEmail(email);
                if (existing != null && email != user.Email) errors.Add("Email", "Email đã tồn tại");
                user.Email = email;
            }
            if (!string.IsNullOrEmpty(username))
            {
                var existing = _userRepository.GetByUsername(username);
                if (existing != null && username != user.Username) errors.Add("Username", "Username đã tồn tại");
                user.Username = username;
            }
            if (!string.IsNullOrEmpty(fullname)) user.Fullname = fullname;
            if (dob.HasValue) user.Dob = dob.Value;
            if (communeId.HasValue) user.CommuneId = communeId.Value;
            if (!string.IsNullOrEmpty(address)) user.Address = address;
            if (!string.IsNullOrEmpty(phoneNumber)) user.PhoneNumber = phoneNumber;
            // address and phone number handled via user.Address / user.PhoneNumber on frontend request mapping
            if (schoolId.HasValue) user.SchoolId = schoolId.Value;

            if (!string.IsNullOrEmpty(oldPassword) && !string.IsNullOrEmpty(newPassword) && !user.IsLoginWithGoogle)
            {
                // verify old password
                bool verified = BCrypt.Net.BCrypt.Verify(oldPassword, user.PasswordHash ?? "");
                if (!verified) errors.Add("OldPassword", "Mật khẩu cũ không đúng");
                // hash new password

                if (oldPassword == newPassword)
                {
                    errors.Add("NewPassword", "Mật khẩu mới phải khác mật khẩu cũ");
                }

                string hash = BCrypt.Net.BCrypt.HashPassword(newPassword, SALT_ROUNDS);
                user.PasswordHash = hash;
            }

            if (user.IsLoginWithGoogle && !string.IsNullOrEmpty(newPassword))
            {
                // hash new password
                string hash = BCrypt.Net.BCrypt.HashPassword(newPassword, SALT_ROUNDS);
                user.PasswordHash = hash;
                user.IsLoginWithGoogle = false; // chuyển sang đăng nhập bằng mật khẩu
            }
            if (gender.HasValue) user.Gender = (gender.Value == 1);
            user.UpdatedAt = DateTime.Now;

            string? oldAvatar = user.Avatar;
            string? uploadedUrl = null;

            if (avatarFile != null && avatarFile.Length > 0)
            {
                var ext = Path.GetExtension(avatarFile.FileName)?.ToLowerInvariant();
                if (string.IsNullOrEmpty(ext) || !FileConstants.AllowedImageExtensions.Contains(ext))
                    errors.Add("Avatar", "Định dạng ảnh không được hỗ trợ");
                if (avatarFile.Length > FileConstants.MaxImageSize)
                    errors.Add("Avatar", "Kích thước ảnh vượt quá giới hạn");

                uploadedUrl = await _cloudinary.UploadImageAsync(avatarFile, FileConstants.AvatarUploadPath);
                if (string.IsNullOrEmpty(uploadedUrl)) uploadedUrl = null;
                user.Avatar = uploadedUrl;
            }
            else if (avatarFile == null)
            {
                user.Avatar = oldAvatar;
            }

            if (errors.Count > 0)
            {
                throw new InvalidFieldException(errors);
            }

            try
            {
                _userRepository.UpdateUser(user);

                // after success, if avatar changed and we uploaded a new one, delete old
                if (!string.IsNullOrEmpty(oldAvatar) && !string.IsNullOrEmpty(uploadedUrl) && !string.Equals(oldAvatar, uploadedUrl, StringComparison.OrdinalIgnoreCase))
                {
                    try { await _cloudinary.DeleteImageAsync(oldAvatar); } catch { }
                }

                return user;
            }
            catch (Exception ex)
            {
                // if update failed and we uploaded a new avatar, delete the uploaded to avoid orphan
                if (!string.IsNullOrEmpty(uploadedUrl) && !string.Equals(oldAvatar, uploadedUrl, StringComparison.OrdinalIgnoreCase))
                {
                    try { await _cloudinary.DeleteImageAsync(uploadedUrl); } catch { }
                }
                throw new InvalidOperationException("Cập nhật dữ liệu không thành công: " + ex.Message, ex);
            }
        }

        public bool DeactivateAccount(Guid id)
        {
            var user = _userRepository.GetById(id);
            if (user == null) return false;
            user.Status = false;
            user.UpdatedAt = DateTime.Now;
            try
            {
                _userRepository.UpdateUser(user);
                return true;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Failed to deactivate account: " + ex.Message, ex);
            }
        }

        public bool ActivateAccount(Guid id)
        {
            var user = _userRepository.GetById(id);
            if (user == null) return false;
            user.Status = true;
            user.UpdatedAt = DateTime.Now;
            try
            {
                _userRepository.UpdateUser(user);
                return true;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Failed to activate account: " + ex.Message, ex);
            }
        }
    }
}
