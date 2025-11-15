using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using System.IO;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;
using StudyHub.Backend.UseCases.Exceptions;
using OfficeOpenXml;
using System.Text;
using System.Globalization;
using System.Text.RegularExpressions;

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

        // Export all accounts to an Excel file (EPPlus)
        public byte[] ExportAccountsToExcel()
        {
            var users = _userRepository.GetAllUsers();

            using (var pkg = new ExcelPackage())
            {
                var ws = pkg.Workbook.Worksheets.Add("Accounts");
                // headers
                ws.Cells[1, 1].Value = "Email";
                ws.Cells[1, 2].Value = "Username";
                ws.Cells[1, 3].Value = "Fullname";
                ws.Cells[1, 4].Value = "Status";
                ws.Cells[1, 5].Value = "Roles";
                ws.Cells[1, 6].Value = "CreatedAt";
                ws.Cells[1, 7].Value = "PhoneNumber";
                ws.Cells[1, 8].Value = "Address";
                ws.Cells[1, 9].Value = "Dob";
                ws.Cells[1, 10].Value = "Gender"; // 1 = male, 0 = female (export as 1/0)

                int row = 2;
                foreach (var u in users)
                {
                    var roles = _roleRepository.GetRolesForUser(u.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
                    ws.Cells[row, 1].Value = u.Email;
                    ws.Cells[row, 2].Value = u.Username;
                    ws.Cells[row, 3].Value = u.Fullname;
                    ws.Cells[row, 4].Value = u.Status == true ? "Có hiệu lực" : "Vô hiệu hoá";
                    ws.Cells[row, 5].Value = string.Join(", ", roles);
                    ws.Cells[row, 6].Value = u.CreatedAt.ToString("dd/MM/yyyy");
                    ws.Cells[row, 7].Value = u.PhoneNumber;
                    ws.Cells[row, 8].Value = u.Address;
                    // Dob may be DateOnly? or DateTime? attempt to format if available
                    try
                    {
                        if (u.Dob.HasValue)
                        {
                            ws.Cells[row, 9].Value = u.Dob.Value.ToString("dd/MM/yyyy");
                        }
                    }
                    catch { }
                    // Gender: store as 1 (true) or 0 (false)
                    try
                    {
                        ws.Cells[row, 10].Value = (u.Gender == true) ? "Nam" : "Nữ";
                    }
                    catch { ws.Cells[row, 10].Value = "0"; }

                    row++;
                }

                // auto-fit columns
                ws.Cells[ws.Dimension.Address].AutoFitColumns();
                return pkg.GetAsByteArray();
            }
        }

        // Import accounts from Excel provided as byte[] (API should convert uploads to base64 and send DTO)
        public ImportResultDto ImportAccountsFromExcel(byte[] fileBytes, string? originalFileName = null)
        {
            var result = new ImportResultDto();
            if (fileBytes == null || fileBytes.Length == 0)
            {
                result.Errors.Add("File is empty or null");
                return result;
            }

            using (var stream = new MemoryStream(fileBytes))
            using (var pkg = new ExcelPackage(stream))
            {
                var ws = pkg.Workbook.Worksheets.FirstOrDefault();
                if (ws == null)
                {
                    result.Errors.Add("No worksheet found in Excel file");
                    return result;
                }

                int row = 2; // assume header in row 1
                var usersWithRoles = new List<(AppUser user, IEnumerable<Guid>? roleIds, int Row)>();
                var emailRows = new Dictionary<string, List<int>>(StringComparer.OrdinalIgnoreCase);
                var usernameRows = new Dictionary<string, List<int>>(StringComparer.OrdinalIgnoreCase);
                while (true)
                {
                    var email = ws.Cells[row, 1].Text?.Trim();
                    if (string.IsNullOrEmpty(email)) break; // stop on empty email
                    result.TotalRows++;

                    // collect for in-sheet duplicate detection
                    if (!string.IsNullOrEmpty(email))
                    {
                        if (!emailRows.ContainsKey(email)) emailRows[email] = new List<int>();
                        emailRows[email].Add(row);
                    }

                    var usernameForDup = ws.Cells[row, 2].Text?.Trim();
                    if (!string.IsNullOrEmpty(usernameForDup))
                    {
                        if (!usernameRows.ContainsKey(usernameForDup)) usernameRows[usernameForDup] = new List<int>();
                        usernameRows[usernameForDup].Add(row);
                    }

                    var rowFieldErrors = new Dictionary<string, List<string>>();

                    try
                    {
                        var username = ws.Cells[row, 2].Text?.Trim();
                        var fullname = ws.Cells[row, 3].Text?.Trim();
                        var statusText = ws.Cells[row, 4].Text?.Trim();
                        var rolesText = ws.Cells[row, 5].Text?.Trim();
                        var createdAtText = ws.Cells[row, 6].Text?.Trim();
                        var phone = ws.Cells[row, 7].Text?.Trim();
                        var address = ws.Cells[row, 8].Text?.Trim();
                        var passwordHashCell = ws.Cells[row, 9].Text?.Trim();
                        var dobText = ws.Cells[row, 10].Text?.Trim();
                        var genderText = ws.Cells[row, 11].Text?.Trim();

                        // helper: remove diacritics and normalize
                        static string NormalizeText(string? s)
                        {
                            if (string.IsNullOrEmpty(s)) return string.Empty;
                            var normalized = s.Normalize(NormalizationForm.FormD);
                            var sb = new StringBuilder();
                            foreach (var ch in normalized)
                            {
                                var uc = CharUnicodeInfo.GetUnicodeCategory(ch);
                                if (uc != UnicodeCategory.NonSpacingMark) sb.Append(ch);
                            }
                            return sb.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant().Replace(" ", "");
                        }

                        // Validate email uniqueness
                        var existingByEmail = _userRepository.GetByEmail(email);
                        if (existingByEmail != null)
                        {
                            if (!rowFieldErrors.ContainsKey("Email")) rowFieldErrors["Email"] = new List<string>();
                            rowFieldErrors["Email"].Add($"Row {row}: Email '{email}' already exists");
                        }

                        // Validate username uniqueness
                        if (!string.IsNullOrEmpty(username))
                        {
                            var existingByUsername = _userRepository.GetByUsername(username);
                            if (existingByUsername != null)
                            {
                                if (!rowFieldErrors.ContainsKey("Username")) rowFieldErrors["Username"] = new List<string>();
                                rowFieldErrors["Username"].Add($"Row {row}: Username '{username}' already exists");
                            }
                        }

                        // Resolve roles and validate combinations
                        List<Guid> roleIds = new List<Guid>();
                        var roleNames = new List<string>();
                        if (!string.IsNullOrEmpty(rolesText))
                        {
                            var rnList = rolesText.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).Select(r => r.Trim());
                            foreach (var rn in rnList)
                            {
                                var role = _roleRepository.GetRoleByName(rn ?? "");
                                if (role != null)
                                {
                                    roleIds.Add(role.Id);
                                    if (!string.IsNullOrEmpty(role.Name)) roleNames.Add(role.Name);
                                }
                                else
                                {
                                    if (!rowFieldErrors.ContainsKey("RoleIds")) rowFieldErrors["RoleIds"] = new List<string>();
                                    rowFieldErrors["RoleIds"].Add($"Row {row}: Role '{rn}' not found");
                                }
                            }
                        }

                        if (roleNames.Any())
                        {
                            bool hasExternal = roleNames.Any(n => string.Equals(n, "External Student", StringComparison.OrdinalIgnoreCase));
                            bool hasSchool = roleNames.Any(n => string.Equals(n, "School Student", StringComparison.OrdinalIgnoreCase));
                            if (hasExternal && hasSchool)
                            {
                                if (!rowFieldErrors.ContainsKey("RoleIds")) rowFieldErrors["RoleIds"] = new List<string>();
                                rowFieldErrors["RoleIds"].Add($"Row {row}: Cannot assign both External Student and School Student roles");
                            }

                            var studentRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "External Student", "School Student" };
                            var managerRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Teacher", "Manager", "Admin", "Moderator" };
                            bool hasStudent = roleNames.Any(n => studentRoles.Contains(n));
                            bool hasManager = roleNames.Any(role => managerRoles.Any(keyword => role.Contains(keyword, StringComparison.OrdinalIgnoreCase)));
                            if (hasStudent && hasManager)
                            {
                                if (!rowFieldErrors.ContainsKey("RoleIds")) rowFieldErrors["RoleIds"] = new List<string>();
                                rowFieldErrors["RoleIds"].Add($"Row {row}: Student roles cannot be combined with manager roles (Teacher/Manager/Admin/Moderator)");
                            }
                        }

                        // Parse CreatedAt
                        DateTime? createdAt = null;
                        if (!string.IsNullOrEmpty(createdAtText))
                        {
                            // expect dd/MM/yyyy from user (e.g., 13/10/2014)
                            if (DateTime.TryParseExact(createdAtText, new[] { "dd/MM/yyyy", "d/M/yyyy" }, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedCreated))
                            {
                                createdAt = parsedCreated;
                            }
                            else if (DateTime.TryParse(createdAtText, out var parsedAny))
                            {
                                createdAt = parsedAny;
                            }
                            else
                            {
                                if (!rowFieldErrors.ContainsKey("CreatedAt")) rowFieldErrors["CreatedAt"] = new List<string>();
                                rowFieldErrors["CreatedAt"].Add($"Row {row}: CreatedAt '{createdAtText}' is not a valid date (expected dd/MM/yyyy)");
                            }
                        }

                        // Parse Dob: prefer explicit dd/MM/yyyy (e.g. 23/10/2014), then fall back to other parses
                        DateOnly? dob = null;
                        if (!string.IsNullOrEmpty(dobText))
                        {
                            // Try exact dd/MM/yyyy formats first (user locale)
                            if (DateOnly.TryParseExact(dobText, new[] { "dd/MM/yyyy", "d/M/yyyy" }, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dobExact))
                            {
                                dob = dobExact;
                            }
                            else if (DateOnly.TryParse(dobText, CultureInfo.InvariantCulture, DateTimeStyles.None, out var d1))
                            {
                                dob = d1;
                            }
                            else if (DateTime.TryParseExact(dobText, new[] { "dd/MM/yyyy", "d/M/yyyy" }, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dtExact))
                            {
                                dob = DateOnly.FromDateTime(dtExact);
                            }
                            else if (DateTime.TryParse(dobText, out var dt))
                            {
                                dob = DateOnly.FromDateTime(dt);
                            }
                            else
                            {
                                if (!rowFieldErrors.ContainsKey("Dob")) rowFieldErrors["Dob"] = new List<string>();
                                rowFieldErrors["Dob"].Add($"Row {row}: Dob '{dobText}' is not a valid date (expected format dd/MM/yyyy)");
                            }
                        }

                        // Parse Gender (accept "Nam"/"Nữ" in Vietnamese or 1/0)
                        bool? genderBool = null;
                        if (!string.IsNullOrEmpty(genderText))
                        {
                            var normGender = NormalizeText(genderText);
                            if (normGender.Contains("nam") || normGender == "1") genderBool = true;
                            else if (normGender.Contains("nu") || normGender == "0") genderBool = false;
                            else if (int.TryParse(genderText, out var gi) && (gi == 0 || gi == 1)) genderBool = (gi == 1);
                            else
                            {
                                if (!rowFieldErrors.ContainsKey("Gender")) rowFieldErrors["Gender"] = new List<string>();
                                rowFieldErrors["Gender"].Add($"Row {row}: Gender '{genderText}' is invalid (expected Nam/Nữ or 1/0)");
                            }
                        }

                        // Validate Status (accept Vietnamese text)
                        bool? statusBool = null;
                        if (!string.IsNullOrEmpty(statusText))
                        {
                            var normStatus = NormalizeText(statusText);
                            if (normStatus.Contains("cohieu") || normStatus.Contains("cohieuluc") || normStatus.Contains("active")) statusBool = true;
                            else if (normStatus.Contains("vohieu") || normStatus.Contains("vohieuhua") || normStatus.Contains("inactive")) statusBool = false;
                            else
                            {
                                if (!rowFieldErrors.ContainsKey("Status")) rowFieldErrors["Status"] = new List<string>();
                                rowFieldErrors["Status"].Add($"Row {row}: Status '{statusText}' is invalid (expected 'Có hiệu lực' or 'Vô hiệu hoá')");
                            }
                        }

                        // Validate phone number (Vietnam format)
                        if (!string.IsNullOrEmpty(phone))
                        {
                            var phoneNorm = phone.Replace(" ", "").Trim();
                            var phoneRegex = new Regex("^(\\+84|0)(3|5|7|8|9)\\d{8}$");
                            if (!phoneRegex.IsMatch(phoneNorm))
                            {
                                if (!rowFieldErrors.ContainsKey("PhoneNumber")) rowFieldErrors["PhoneNumber"] = new List<string>();
                                rowFieldErrors["PhoneNumber"].Add($"Row {row}: PhoneNumber '{phone}' is not a valid Vietnamese mobile number");
                            }
                        }

                        // If any row-level validation errors, record them and skip creation
                        if (rowFieldErrors.Any())
                        {
                            result.Failed++;
                            foreach (var kv in rowFieldErrors)
                            {
                                if (!result.FieldErrors.ContainsKey(kv.Key)) result.FieldErrors[kv.Key] = new List<string>();
                                result.FieldErrors[kv.Key].AddRange(kv.Value);
                            }
                            row++;
                            continue;
                        }

                        // prepare user
                        var user = new AppUser
                        {
                            Id = Guid.NewGuid(),
                            Email = email,
                            Username = string.IsNullOrEmpty(username) ? email : username,
                            Fullname = fullname,
                            CreatedAt = createdAt ?? DateTime.Now,
                            UpdatedAt = DateTime.Now,
                            Status = statusBool ?? true,
                            PhoneNumber = phone,
                            Address = address,
                        };

                        // PasswordHash handling
                        if (!string.IsNullOrEmpty(passwordHashCell)) user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(passwordHashCell, SALT_ROUNDS);
                        else
                        {
                            var defaultPw = _configuration["DefaultImportPassword"] ?? "12345";
                            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(defaultPw, SALT_ROUNDS);
                        }

                        if (dob.HasValue) user.Dob = dob.Value;
                        if (genderBool.HasValue) user.Gender = genderBool.Value;

                        // add to bulk list; actual database insert will occur after validation of all rows
                        usersWithRoles.Add((user, roleIds.Count > 0 ? roleIds : null, row));
                    }
                    catch (Exception ex)
                    {
                        result.Failed++;
                        if (!result.FieldErrors.ContainsKey("_general")) result.FieldErrors["_general"] = new List<string>();
                        result.FieldErrors["_general"].Add($"Row {row}: {ex.Message}");
                    }

                    row++;
                }

                // detect duplicate emails/usernames inside the uploaded worksheet
                foreach (var kv in emailRows.Where(kv => kv.Value.Count > 1))
                {
                    var emailKey = kv.Key;
                    var rows = kv.Value;
                    foreach (var r in rows)
                    {
                        if (!result.FieldErrors.ContainsKey("Email")) result.FieldErrors["Email"] = new List<string>();
                        var otherRows = string.Join(", ", rows.Where(x => x != r));
                        result.FieldErrors["Email"].Add($"Row {r}: Email '{emailKey}' is duplicated in uploaded file (also in rows: {otherRows})");

                        // if this row was scheduled for create (no other validation errors), remove it and count as failed
                        var found = usersWithRoles.Where(u => u.Row == r).ToList();
                        foreach (var f in found)
                        {
                            usersWithRoles.Remove(f);
                            result.Failed++;
                        }
                    }
                }

                foreach (var kv in usernameRows.Where(kv => kv.Value.Count > 1))
                {
                    var usernameKey = kv.Key;
                    var rows = kv.Value;
                    foreach (var r in rows)
                    {
                        if (!result.FieldErrors.ContainsKey("Username")) result.FieldErrors["Username"] = new List<string>();
                        var otherRows = string.Join(", ", rows.Where(x => x != r));
                        result.FieldErrors["Username"].Add($"Row {r}: Username '{usernameKey}' is duplicated in uploaded file (also in rows: {otherRows})");

                        var found = usersWithRoles.Where(u => u.Row == r).ToList();
                        foreach (var f in found)
                        {
                            usersWithRoles.Remove(f);
                            result.Failed++;
                        }
                    }
                }

                // After processing all rows, if there are any field errors, throw so API returns 400
                if (result.FieldErrors.Any())
                {
                    throw new InvalidImportFieldException(result.FieldErrors);
                }

                // No validation errors — create users in bulk
                if (usersWithRoles.Any())
                {
                    _userRepository.CreateUsersWithRoles(usersWithRoles.Select(u => (u.user, u.roleIds)));
                    result.Imported = usersWithRoles.Count;
                }
            }

            return result;
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
