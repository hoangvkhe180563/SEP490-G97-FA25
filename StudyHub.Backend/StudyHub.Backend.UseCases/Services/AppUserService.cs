using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using System.IO;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;

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

        // Admin / management methods
        public AppUser? GetUserById(Guid id)
        {
            // Return the domain AppUser and let the API layer map/format the data for clients.
            var user = _userRepository.GetById(id);
            return user;
        }

        // Async create account with optional avatar upload handled here (clean architecture: business logic in service)
        public async Task<AppUser> CreateAccountAsync(string email, string password, string username, IEnumerable<Guid>? roleIds, int communeId, int schoolId, string? fullname = null, IFormFile? avatarFile = null, int gender = 0)
        {
            var existing = _userRepository.GetByEmail(email);
            if (existing != null) throw new InvalidOperationException("Email đã tồn tại");

            existing = _userRepository.GetByUsername(username);
            if (existing != null) throw new InvalidOperationException("Username đã tồn tại");

            string hash = BCrypt.Net.BCrypt.HashPassword(password, SALT_ROUNDS);

            string? uploadedUrl = null;
            if (avatarFile != null && avatarFile.Length > 0)
            {
                // validate
                var ext = Path.GetExtension(avatarFile.FileName)?.ToLowerInvariant();
                if (string.IsNullOrEmpty(ext) || !FileConstants.AllowedImageExtensions.Contains(ext))
                    throw new InvalidOperationException("Định dạng ảnh không được hỗ trợ");
                if (avatarFile.Length > FileConstants.MaxImageSize)
                    throw new InvalidOperationException("Kích thước ảnh vượt quá giới hạn");

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
                CommuneId = communeId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Status = true,
                Avatar = uploadedUrl,
                Gender = (gender == 1),
                SchoolId = schoolId
            };

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
        public async Task<AppUser?> EditAccountAsync(Guid id, string? email = null, string? username = null, string? fullname = null, int? communeId = null, bool? status = null, IFormFile? avatarFile = null, int? gender = null, IEnumerable<Guid>? roleIds = null, int? schoolId = null)
        {
            var user = _userRepository.GetById(id);
            if (user == null) return null;

            if (!string.IsNullOrEmpty(email))
            {
                var existing = _userRepository.GetByEmail(email);
                if (existing != null && email != user.Email) throw new InvalidOperationException("Email đã tồn tại");
                user.Email = email;
            }
            if (!string.IsNullOrEmpty(username))
            {
                var existing = _userRepository.GetByUsername(username);
                if (existing != null && username != user.Username) throw new InvalidOperationException("Username đã tồn tại");
                user.Username = username;
            }
            if (!string.IsNullOrEmpty(fullname)) user.Fullname = fullname;
            if (communeId.HasValue) user.CommuneId = communeId.Value;
            if (schoolId.HasValue) user.SchoolId = schoolId.Value;

            if (status.HasValue) user.Status = status.Value;
            if (gender.HasValue) user.Gender = (gender.Value == 1);
            user.UpdatedAt = DateTime.UtcNow;

            string? oldAvatar = user.Avatar;
            string? uploadedUrl = null;

            if (avatarFile != null && avatarFile.Length > 0)
            {
                var ext = Path.GetExtension(avatarFile.FileName)?.ToLowerInvariant();
                if (string.IsNullOrEmpty(ext) || !FileConstants.AllowedImageExtensions.Contains(ext))
                    throw new InvalidOperationException("Định dạng ảnh không được hỗ trợ");
                if (avatarFile.Length > FileConstants.MaxImageSize)
                    throw new InvalidOperationException("Kích thước ảnh vượt quá giới hạn");

                uploadedUrl = await _cloudinary.UploadImageAsync(avatarFile, FileConstants.AvatarUploadPath);
                if (string.IsNullOrEmpty(uploadedUrl)) uploadedUrl = null;
                user.Avatar = uploadedUrl;
            }
            else if (avatarFile == null)
            {
                user.Avatar = oldAvatar;
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

        public AppUser CreateAccount(string email, string password, string username, IEnumerable<Guid>? roleIds, int communeId, string? fullname = null, string? avatar = null, int gender = 0)
        {
            var existing = _userRepository.GetByEmail(email);
            if (existing != null) throw new InvalidOperationException("Email already exists");

            string hash = BCrypt.Net.BCrypt.HashPassword(password, SALT_ROUNDS);
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = hash,
                Username = username,
                Fullname = fullname,
                CommuneId = communeId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Status = true,
                Avatar = avatar,
                Gender = (gender == 1)
            };

            try
            {
                _userRepository.CreateUser(user, roleIds);
                return user;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Failed to create account: " + ex.Message, ex);
            }
        }

        public AppUser? EditAccount(Guid id, string? email = null, string? username = null, string? fullname = null, int? communeId = null, bool? status = null, string? avatar = null, int? gender = null, IEnumerable<Guid>? roleIds = null)
        {
            var user = _userRepository.GetById(id);
            if (user == null) return null;

            if (!string.IsNullOrEmpty(email))
            {
                var existing = _userRepository.GetByEmail(email);
                if (existing != null) throw new InvalidOperationException("Email already exists");
                user.Email = email;
            }
            if (!string.IsNullOrEmpty(username))
            {
                var existing = _userRepository.GetByUsername(username);
                if (existing != null) throw new InvalidOperationException("Username already exists");
                user.Username = username;
            }
            if (!string.IsNullOrEmpty(fullname)) user.Fullname = fullname;
            if (communeId.HasValue) user.CommuneId = communeId.Value;
            if (status.HasValue) user.Status = status.Value;
            if (!string.IsNullOrEmpty(avatar)) user.Avatar = avatar;
            if (gender.HasValue) user.Gender = (gender.Value == 1);
            user.UpdatedAt = DateTime.UtcNow;

            try
            {
                _userRepository.UpdateUser(user, roleIds);
                return user;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Failed to update account: " + ex.Message, ex);
            }
        }

        public bool DeactivateAccount(Guid id)
        {
            var user = _userRepository.GetById(id);
            if (user == null) return false;
            user.Status = false;
            user.UpdatedAt = DateTime.UtcNow;
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
            user.UpdatedAt = DateTime.UtcNow;
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
