using Microsoft.AspNetCore.Http;
using OfficeOpenXml;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Services
{
    public class ClassMemberService
    {
        private readonly IClassRepository _classRepository;
        private readonly IClassMemberRepository _classMemberRepository;
        private readonly ICloudinaryRepository _fileStorage;
        private readonly IAppUserRepository _userRepository;
        private readonly SmtpEmailService _emailService;
        private static bool _epplusLicenseInitialized = false;
        private static readonly object _epplusLicenseInitLock = new object();
        public ClassMemberService(IClassMemberRepository classRepository, ICloudinaryRepository fileStorage, IAppUserRepository userRepository, SmtpEmailService emailService, IClassRepository classes)
        {
            _classMemberRepository = classRepository;
            _fileStorage = fileStorage;
            _userRepository = userRepository;
            _emailService = emailService;
            _classRepository = classes;
        }
        public List<AppUserClass> GetClassMembers(int id) => _classMemberRepository.GetClassMembers(id);


        // Invite flow moved to service. Accept simple primitives (no Api DTOs) so use-cases project doesn't reference Api project.
        public async Task<List<object>> InviteByEmailsAsync(int classId, List<string> emails, string role, string? message, string baseFrontendUrl)
        {
            var cls = _classRepository.GetClassById(classId);
            if (cls == null) throw new ArgumentException("Không tìm thấy lớp học.");

            if (emails == null || emails.Count == 0)
                throw new ArgumentException("Cần cung cấp ít nhất một email để mời.");

            var results = new List<object>();

            foreach (var raw in emails.Select(e => e?.Trim()).Where(e => !string.IsNullOrWhiteSpace(e)).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var email = raw!;
                var user = _userRepository.GetByEmail(email);

                if (user != null)
                {
                    var invited = _classMemberRepository.InviteMember(user.Id, classId);
                    var acceptUrl = $"{baseFrontendUrl}/class/{role.ToLower()}/{classId}/invite/confirm";
                    try
                    {
                        await _emailService.SendClassInvitationEmailAsync(email, cls.Name ?? "Class", acceptUrl, inviterName: _userRepository.GetById(cls.CreatedBy)?.Fullname ?? "", customMessage: message);
                    }
                    catch
                    {
                        // swallow email errors
                    }
                    results.Add(new { email, existingAccount = true, invited });
                }
                else
                {
                    var registerUrl = $"{baseFrontendUrl}/register?email={WebUtility.UrlEncode(email)}&redirect=/class/{classId}";
                    try
                    {
                        await _emailService.SendClassInvitationEmailAsync(email, cls.Name ?? "Class", registerUrl, inviterName: _userRepository.GetById(cls.CreatedBy)?.Fullname ?? "", customMessage: message);
                    }
                    catch
                    {
                    }
                    results.Add(new { email, existingAccount = false, invited = false });
                }
            }

            return results;
        }
        private static void EnsureEpplusLicense()
        {
            if (_epplusLicenseInitialized) return;

            lock (_epplusLicenseInitLock)
            {
                if (_epplusLicenseInitialized) return;

                try
                {
                    var excelPackageType = typeof(ExcelPackage);

                    // Try EPPlus 8+ static property: ExcelPackage.License
                    var licenseProp = excelPackageType.GetProperty("License", BindingFlags.Static | BindingFlags.Public);
                    if (licenseProp != null)
                    {
                        var licensePropType = licenseProp.PropertyType;

                        object valueToSet = null;

                        // If the License property is an enum, parse NonCommercial
                        if (licensePropType.IsEnum)
                        {
                            try
                            {
                                valueToSet = Enum.Parse(licensePropType, "NonCommercial");
                            }
                            catch
                            {
                                valueToSet = null;
                            }
                        }
                        else
                        {
                            // Try static field or property named "NonCommercial" on the license type
                            var staticField = licensePropType.GetField("NonCommercial", BindingFlags.Static | BindingFlags.Public);
                            if (staticField != null)
                            {
                                valueToSet = staticField.GetValue(null);
                            }
                            else
                            {
                                var staticProp = licensePropType.GetProperty("NonCommercial", BindingFlags.Static | BindingFlags.Public);
                                if (staticProp != null)
                                {
                                    valueToSet = staticProp.GetValue(null);
                                }
                            }
                        }

                        // If we found a candidate, set it
                        if (valueToSet != null)
                        {
                            licenseProp.SetValue(null, valueToSet);
                        }
                    }
                    else
                    {
                        // Fallback for older EPPlus versions: ExcelPackage.LicenseContext = LicenseContext.NonCommercial
                        var lcProp = excelPackageType.GetProperty("LicenseContext", BindingFlags.Static | BindingFlags.Public);
                        if (lcProp != null && lcProp.PropertyType.IsEnum)
                        {
                            try
                            {
                                var lcValue = Enum.Parse(lcProp.PropertyType, "NonCommercial");
                                lcProp.SetValue(null, lcValue);
                            }
                            catch
                            {
                                // ignore
                            }
                        }
                        else
                        {
                            // As a last resort, try the known API (compile-time) - harmless when available
                            try
                            {
                                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                            }
                            catch
                            {
                                // ignore if not available
                            }
                        }
                    }
                }
                catch
                {
                    // If anything fails, don't crash the app here. EPPlus will raise a clear exception when used if license isn't set.
                }
                finally
                {
                    _epplusLicenseInitialized = true;
                }
            }
        }

        public async Task<List<object>> InviteByExcelAsync(int classId, IFormFile file, string role, string? message, string baseFrontendUrl)
        {
            var cls = _classRepository.GetClassById(classId);
            if (cls == null) throw new ArgumentException("Không tìm thấy lớp học.");

            if (file == null || file.Length == 0)
                throw new ArgumentException("File không hợp lệ.");

            // Ensure EPPlus license is configured once
            EnsureEpplusLicense();

            // Read file into memory (beware large files)
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            ms.Position = 0;

            // In case older API is present, ensure LicenseContext is set too (safe no-op)
            try
            {
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            }
            catch
            {
                // ignore if property not available in this EPPlus build
            }

            using var package = new ExcelPackage(ms);
            var workbook = package.Workbook;
            if (workbook == null || workbook.Worksheets.Count == 0)
                throw new ArgumentException("File Excel không có sheets.");

            var sheet = workbook.Worksheets.First();

            // Build header map (header names -> column index) to support flexible school format
            var headerRow = 1;
            var maxCol = sheet.Dimension?.End.Column ?? 1;
            var maxRow = sheet.Dimension?.End.Row ?? 1;

            var headerMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            for (int c = 1; c <= maxCol; c++)
            {
                var txt = sheet.Cells[headerRow, c].Text?.Trim();
                if (!string.IsNullOrWhiteSpace(txt))
                {
                    // normalize header (lower, remove accents/whitespace not required here)
                    headerMap[txt.ToLowerInvariant()] = c;
                }
            }

            // Helper to find a column index by a set of possible header keys
            int? FindColumn(params string[] keys)
            {
                foreach (var k in keys)
                {
                    // direct match
                    if (headerMap.TryGetValue(k.ToLowerInvariant(), out var col)) return col;
                }
                // try contains matching (e.g., "email address", "student id", "full name")
                foreach (var kv in headerMap)
                {
                    foreach (var k in keys)
                    {
                        if (kv.Key.IndexOf(k.ToLowerInvariant(), StringComparison.OrdinalIgnoreCase) >= 0)
                            return kv.Value;
                    }
                }
                return null;
            }

            // Preferred header names for common school fields
            var emailCol = FindColumn("email", "e-mail", "email address", "emailaddress", "địa chỉ email", "địa chỉ email") ?? 0;
            var nameCol = FindColumn("name", "full name", "fullname", "student_name", "ho ten", "họ tên", "họ và tên");
            var studentIdCol = FindColumn("student_id", "student id", "id", "mã học sinh", "mã hs", "studentno", "student_no");
            var gradeCol = FindColumn("grade", "class", "khối", "lớp", "grade/section", "year");
            var sectionCol = FindColumn("section", "section/classroom", "phòng", "section");
            var roleCol = FindColumn("role", "vai trò", "vaitro");

            // If no header for email found, assume the first column is email (common simple template)
            bool headerPresent = headerMap.Count > 0;
            if ((emailCol == 0 || emailCol == 0) && headerPresent)
            {
                // Try to fallback: scan first row cells for any cell that contains "@" to detect header-less file
                // but safer: if headers exist but none matched email, try to treat column 1 as email
                emailCol = 1;
            }
            if (!headerPresent)
            {
                // No headers at all -> treat first column as email, second as name if present, third as student id...
                emailCol = 1;
                if (nameCol == null && maxCol >= 2) nameCol = 2;
                if (studentIdCol == null && maxCol >= 3) studentIdCol = 3;
            }

            if (emailCol == 0)
                emailCol = 1; // final fallback

            // Prepare regex for basic email validation
            var emailRegex = new System.Text.RegularExpressions.Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", System.Text.RegularExpressions.RegexOptions.Compiled | System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            var rawRows = new List<Dictionary<string, string>>();
            var emails = new List<string>();

            // Determine data start row: if header-like text exists, start from headerRow+1, else from headerRow
            var startRow = headerPresent ? headerRow + 1 : headerRow;
            var lastRow = maxRow;

            for (int r = startRow; r <= lastRow; r++)
            {
                // Read cells
                string GetCell(int? colIndex)
                {
                    if (colIndex == null || colIndex == 0) return string.Empty;
                    return sheet.Cells[r, colIndex.Value].Text?.Trim() ?? string.Empty;
                }

                var rowEmail = GetCell(emailCol);
                var rowName = GetCell(nameCol);
                var rowStudentId = GetCell(studentIdCol);
                var rowGrade = GetCell(gradeCol);
                var rowSection = GetCell(sectionCol);
                var rowRole = GetCell(roleCol);

                // Skip empty rows (no email and no other meaningful data)
                if (string.IsNullOrWhiteSpace(rowEmail) && string.IsNullOrWhiteSpace(rowName) && string.IsNullOrWhiteSpace(rowStudentId))
                    continue;

                // If email cell doesn't look like an email but another column contains it, try find
                if (string.IsNullOrWhiteSpace(rowEmail))
                {
                    // scan the row for something that looks like an email
                    for (int c = 1; c <= maxCol; c++)
                    {
                        var candidate = sheet.Cells[r, c].Text?.Trim() ?? "";
                        if (!string.IsNullOrWhiteSpace(candidate) && candidate.Contains("@"))
                        {
                            rowEmail = candidate;
                            break;
                        }
                    }
                }

                // Normalize role fallback
                if (string.IsNullOrWhiteSpace(rowRole))
                {
                    rowRole = role ?? "Student";
                }

                var item = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["email"] = rowEmail ?? "",
                    ["name"] = rowName ?? "",
                    ["studentId"] = rowStudentId ?? "",
                    ["grade"] = rowGrade ?? "",
                    ["section"] = rowSection ?? "",
                    ["role"] = rowRole ?? ""
                };

                rawRows.Add(item);

                if (!string.IsNullOrWhiteSpace(rowEmail) && emailRegex.IsMatch(rowEmail))
                {
                    emails.Add(rowEmail);
                }
            }

            if (emails.Count == 0)
                throw new ArgumentException("Không tìm thấy email hợp lệ trong file.");

            // Deduplicate emails preserving order
            var distinctEmails = emails
                .Select(e => e.Trim())
                .Where(e => !string.IsNullOrWhiteSpace(e))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            // Call existing invite logic
            var serviceResults = await InviteByEmailsAsync(classId, distinctEmails, role, message, baseFrontendUrl);
            // serviceResults expected to be List<object> where each object likely contains 'email' property.
            // Attempt to create a map from email -> result object for merging
            var resultByEmail = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
            try
            {
                foreach (var obj in serviceResults)
                {
                    if (obj == null) continue;
                    // Try to read 'email' property via reflection or as IDictionary
                    string emailKey = null;
                    if (obj is System.Collections.IDictionary dict)
                    {
                        // dict keys may be "email" or "Email"
                        foreach (var k in dict.Keys)
                        {
                            var ks = k?.ToString() ?? "";
                            if (ks.Equals("email", StringComparison.OrdinalIgnoreCase))
                            {
                                emailKey = dict[k]?.ToString();
                                break;
                            }
                        }
                    }
                    else
                    {
                        var objType = obj.GetType();
                        var prop = objType.GetProperty("email", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase)
                                ?? objType.GetProperty("Email", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                        if (prop != null)
                            emailKey = prop.GetValue(obj)?.ToString();
                    }

                    if (!string.IsNullOrWhiteSpace(emailKey) && !resultByEmail.ContainsKey(emailKey))
                        resultByEmail[emailKey] = obj;
                }
            }
            catch
            {
                // ignore mapping errors; we'll still return rawRows + serviceResults
            }

            // Build merged results: for each raw row that had an email, attach service result if available
            var merged = new List<object>();
            foreach (var row in rawRows)
            {
                var e = row.ContainsKey("email") ? row["email"] : "";
                object svc = null;
                if (!string.IsNullOrWhiteSpace(e) && resultByEmail.TryGetValue(e, out var found)) svc = found;

                merged.Add(new
                {
                    input = row,
                    result = svc
                });
            }

            // Additionally, include service results for emails that may not have had full input rows
            foreach (var svc in serviceResults)
            {
                // try extract email
                string emailKey = null;
                if (svc is System.Collections.IDictionary dict)
                {
                    foreach (var k in dict.Keys)
                    {
                        var ks = k?.ToString() ?? "";
                        if (ks.Equals("email", StringComparison.OrdinalIgnoreCase))
                        {
                            emailKey = dict[k]?.ToString();
                            break;
                        }
                    }
                }
                else
                {
                    var objType = svc.GetType();
                    var prop = objType.GetProperty("email", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase)
                            ?? objType.GetProperty("Email", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                    if (prop != null) emailKey = prop.GetValue(svc)?.ToString();
                }

                // if not present in merged (no input row), add as standalone
                if (string.IsNullOrWhiteSpace(emailKey) || !rawRows.Any(r => string.Equals(r.GetValueOrDefault("email"), emailKey, StringComparison.OrdinalIgnoreCase)))
                {
                    merged.Add(new
                    {
                        input = (object?)null,
                        result = svc
                    });
                }
            }

            return merged;
        }
        // Helpers for confirm/kick with string parsing (controller can call these)
        public bool? ConfirmMemberFromString(int classId, string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid)) return null;
            var cls = _classRepository.GetClassById(classId);
            if (cls == null) return false;
            return _classMemberRepository.ConfirmMember(userGuid, classId);
        }
        public bool? DeclineMemberFromString(int classId, string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid)) return null;
            var cls = _classRepository.GetClassById(classId);
            if (cls == null) return false;
            return _classMemberRepository.DeclineMember(userGuid, classId);
        }

        public bool? KickMemberFromString(int classId, string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid)) return null;
            var cls = _classRepository.GetClassById(classId);
            if (cls == null) return false;
            return _classMemberRepository.KickMember(userGuid, classId);
        }
        public List<Class> GetAllClassByUserId(Guid userid) => _classRepository.GetAllClassByUserId(userid);


        public bool InviteMember(Guid userId, int classId) => _classMemberRepository.InviteMember(userId, classId);
        public bool ConfirmMember(Guid userId, int classId) => _classMemberRepository.ConfirmMember(userId, classId);
        public bool KickMember(Guid userId, int classId) => _classMemberRepository.KickMember(userId, classId);
    }
}
