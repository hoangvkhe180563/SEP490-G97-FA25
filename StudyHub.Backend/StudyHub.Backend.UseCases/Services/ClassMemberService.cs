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
using System.IO;

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

        public ClassMemberService(
            IClassMemberRepository classRepository,
            ICloudinaryRepository fileStorage,
            IAppUserRepository userRepository,
            SmtpEmailService emailService,
            IClassRepository classes)
        {
            _classMemberRepository = classRepository;
            _fileStorage = fileStorage;
            _userRepository = userRepository;
            _emailService = emailService;
            _classRepository = classes;
        }

        public List<AppUserClass> GetClassMembers(int id) => _classMemberRepository.GetClassMembers(id);

        // Invite flow moved to service. Accept simple primitives (no Api DTOs) so use-cases project doesn't reference Api project.
        public async Task<List<object>> InviteByEmailsAsync(int classId, List<string> emails, string role, string message, string baseFrontendUrl)
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
                    var acceptUrl = $"{baseFrontendUrl}/class/{role.ToLowerInvariant()}/{classId}/invite/confirm";
                    try
                    {
                        var inviterName = _userRepository.GetById(cls.CreatedBy)?.Fullname ?? string.Empty;
                        await _emailService.SendClassInvitationEmailAsync(email, cls.Name ?? "Class", acceptUrl, inviterName: inviterName, customMessage: message);
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
                        var inviterName = _userRepository.GetById(cls.CreatedBy)?.Fullname ?? string.Empty;
                        await _emailService.SendClassInvitationEmailAsync(email, cls.Name ?? "Class", registerUrl, inviterName: inviterName, customMessage: message);
                    }
                    catch
                    {
                        // swallow
                    }
                    results.Add(new { email, existingAccount = false, invited = false });
                }
            }

            return results;
        }

        /// <summary>
        /// Try to set EPPlus license in a runtime-safe way:
        /// - Prefer EPPlus 8+ static ExcelPackage.License (set via reflection)
        /// - Fallback to older LicenseContext property (set via reflection)
        /// This avoids compile-time references to obsolete symbols that produce CS0618 warnings.
        /// </summary>
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

                        object? valueToSet = null;

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
                        // Use reflection so we don't reference the obsolete LicenseContext symbol at compile time.
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
                        // If neither property exists (very old version), do nothing – EPPlus will throw if license required.
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

        public async Task<List<object>> InviteByExcelAsync(int classId, IFormFile file, string role, string message, string baseFrontendUrl)
        {
            var cls = _classRepository.GetClassById(classId);
            if (cls == null) throw new ArgumentException("Không tìm thấy lớp học.");

            if (file == null || file.Length == 0)
                throw new ArgumentException("File không hợp lệ hoặc trống.");

            // Optional server-side size guard (adjust as needed)
            const long maxBytes = 10 * 1024 * 1024; // 10 MB
            if (file.Length > maxBytes)
                throw new ArgumentException($"Kích thước file vượt quá giới hạn ({maxBytes / (1024 * 1024)} MB).");

            // Ensure EPPlus license is configured once
            EnsureEpplusLicense();

            // Read file into memory (beware large files)
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            ms.Position = 0;

            using var package = new ExcelPackage(ms);
            var workbook = package.Workbook;
            if (workbook == null || workbook.Worksheets.Count == 0)
                throw new ArgumentException("File Excel không có sheets.");

            var sheet = workbook.Worksheets.First();

            // Build header map (header names -> column index)
            var headerRow = 1;
            var maxCol = sheet.Dimension?.End.Column ?? 1;
            var maxRow = sheet.Dimension?.End.Row ?? 1;

            var headerMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            for (int c = 1; c <= maxCol; c++)
            {
                // normalize to non-null string to avoid nullable conversions later
                var txt = sheet.Cells[headerRow, c].Text?.Trim() ?? string.Empty;
                if (!string.IsNullOrWhiteSpace(txt))
                {
                    headerMap[txt.ToLowerInvariant()] = c;
                }
            }

            // Helper to find a column index by a set of possible header keys
            int? FindColumn(params string[] keys)
            {
                foreach (var k in keys)
                {
                    if (k == null) continue;
                    var keyLower = k.ToLowerInvariant();
                    if (headerMap.TryGetValue(keyLower, out var col)) return col;
                }
                foreach (var kv in headerMap)
                {
                    foreach (var k in keys)
                    {
                        if (k == null) continue;
                        if (kv.Key.IndexOf(k.ToLowerInvariant(), StringComparison.OrdinalIgnoreCase) >= 0)
                            return kv.Value;
                    }
                }
                return null;
            }

            // Acceptable header variants (Vietnamese & English)
            var emailKeys = new[] { "email", "e-mail", "email address", "emailaddress", "địa chỉ email", "địa chỉ", "mail" };
            var nameKeys = new[] { "họ và tên", "họ tên", "ho ten", "fullname", "full name", "name", "tên", "ten" };

            var emailColNullable = FindColumn(emailKeys);
            var emailCol = emailColNullable ?? 0;
            var nameCol = FindColumn(nameKeys);

            var headerPresent = headerMap.Count > 0;

            // If headers present but missing email/name -> validate failure
            var missingHeaders = new List<string>();
            if (headerPresent)
            {
                if (emailCol == 0) missingHeaders.Add("Email");
                if (nameCol == null) missingHeaders.Add("Họ và tên");
                if (missingHeaders.Count > 0)
                {
                    // If headers present but missing required ones, reject with clear message
                    throw new ArgumentException($"File thiếu cột bắt buộc: {string.Join(", ", missingHeaders)}. Vui lòng đảm bảo file có header 'Email' và 'Họ và tên' (có thể bằng tiếng Việt hoặc tiếng Anh).");
                }
            }
            else
            {
                // No headers: assume col 1 = email, col 2 = name (if present)
                emailCol = 1;
                if (nameCol == null && maxCol >= 2) nameCol = 2;
            }

            if (emailCol == 0) emailCol = 1; // final fallback

            // Prepare regex for basic email validation
            var emailRegex = new System.Text.RegularExpressions.Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", System.Text.RegularExpressions.RegexOptions.Compiled | System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            var rawRows = new List<Dictionary<string, string>>();
            var emails = new List<(string email, int row)>();
            var invalidRows = new List<object>();

            var startRow = headerPresent ? headerRow + 1 : headerRow;
            var lastRow = maxRow;

            // Optional row limit to protect server (adjust as needed)
            const int maxRows = 5000;
            if (lastRow - startRow + 1 > maxRows)
                throw new ArgumentException($"Số lượng hàng vượt quá giới hạn ({maxRows}). Vui lòng chia nhỏ file.");

            for (int r = startRow; r <= lastRow; r++)
            {
                string GetCell(int? colIndex)
                {
                    if (colIndex == null || colIndex == 0) return string.Empty;
                    return sheet.Cells[r, colIndex.Value].Text?.Trim() ?? string.Empty;
                }

                var rowEmail = GetCell(emailCol);
                var rowName = GetCell(nameCol);

                // Skip completely empty rows
                if (string.IsNullOrWhiteSpace(rowEmail) && string.IsNullOrWhiteSpace(rowName))
                    continue;

                // If email cell empty, scan for a candidate in the row
                if (string.IsNullOrWhiteSpace(rowEmail))
                {
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

                var item = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["email"] = rowEmail ?? string.Empty,
                    ["name"] = rowName ?? string.Empty
                };

                // Validate
                var reasons = new List<string>();
                if (string.IsNullOrWhiteSpace(item["email"]))
                {
                    reasons.Add("Thiếu email");
                }
                else if (!emailRegex.IsMatch(item["email"]))
                {
                    reasons.Add("Email không hợp lệ");
                }

                if (string.IsNullOrWhiteSpace(item["name"]))
                {
                    reasons.Add("Thiếu họ và tên");
                }

                if (reasons.Count > 0)
                {
                    invalidRows.Add(new { row = r, email = item["email"], name = item["name"], reasons });
                    continue; // skip adding to emails/rawRows for processing
                }

                rawRows.Add(item);
                emails.Add((item["email"], r));
            }

            if (emails.Count == 0)
            {
                // If no valid emails found, include invalidRows details in message
                var details = invalidRows.Count > 0
                    ? $" Một số hàng không hợp lệ: {invalidRows.Count} hàng."
                    : "";
                throw new ArgumentException($"Không tìm thấy email hợp lệ trong file.{details}");
            }

            // Deduplicate emails preserving order and also track duplicates found
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var distinctEmails = new List<string>();
            var duplicateRows = new List<object>();
            foreach (var (email, row) in emails)
            {
                var t = (email ?? string.Empty).Trim();
                if (!seen.Add(t))
                {
                    duplicateRows.Add(new { row, email = t });
                }
                else
                {
                    distinctEmails.Add(t);
                }
            }

            // Call existing invite logic
            var serviceResults = await InviteByEmailsAsync(classId, distinctEmails, role, message, baseFrontendUrl);

            // Map service results by email (best-effort)
            var resultByEmail = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
            try
            {
                foreach (var obj in serviceResults)
                {
                    if (obj == null) continue;
                    string? emailKey = null;
                    if (obj is System.Collections.IDictionary dict)
                    {
                        foreach (var k in dict.Keys)
                        {
                            var ks = k.ToString() ?? "";
                            if (ks.Equals("email", StringComparison.OrdinalIgnoreCase))
                            {
                                var val = dict[k];
                                emailKey = val?.ToString();
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
                        {
                            var val = prop.GetValue(obj);
                            emailKey = val?.ToString();
                        }
                    }

                    if (!string.IsNullOrWhiteSpace(emailKey) && !resultByEmail.ContainsKey(emailKey))
                        resultByEmail[emailKey!] = obj;
                }
            }
            catch
            {
                // ignore mapping errors
            }

            // Build merged results per input row
            var merged = new List<object>();

            foreach (var row in rawRows)
            {
                row.TryGetValue("email", out var e);
                e ??= string.Empty;
                object? svc = null;
                if (!string.IsNullOrWhiteSpace(e) && resultByEmail.TryGetValue(e, out var found)) svc = found;

                merged.Add(new
                {
                    input = row,
                    result = svc
                });
            }

            // Include service results for emails that may not have had full input rows
            foreach (var svc in serviceResults)
            {
                string? emailKey = null;
                if (svc is System.Collections.IDictionary dict)
                {
                    foreach (var k in dict.Keys)
                    {
                        var ks = k?.ToString() ?? "";
                        if (ks.Equals("email", StringComparison.OrdinalIgnoreCase))
                        {
#pragma warning disable CS8604 // Possible null reference argument.
                            var val = dict[k];
#pragma warning restore CS8604 // Possible null reference argument.
                            emailKey = val?.ToString();
                            break;
                        }
                    }
                }
                else
                {
                    var objType = svc.GetType();
                    var prop = objType.GetProperty("email", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase)
                            ?? objType.GetProperty("Email", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                    if (prop != null)
                    {
                        var val = prop.GetValue(svc);
                        emailKey = val?.ToString();
                    }
                }

                var emailKeyNormalized = emailKey ?? string.Empty;
                var existsInRaw = rawRows.Any(r =>
                {
                    r.TryGetValue("email", out var rv);
                    return string.Equals(rv ?? string.Empty, emailKeyNormalized, StringComparison.OrdinalIgnoreCase);
                });

                if (string.IsNullOrWhiteSpace(emailKey) || !existsInRaw)
                {
                    merged.Add(new
                    {
                        input = (object?)null,
                        result = svc
                    });
                }
            }

            // Prepare summary as first element: total rows examined, valid processed, invalid rows, duplicates
            var summary = new
            {
                totalRows = lastRow - startRow + 1,
                processed = merged.Count,
                invalidCount = invalidRows.Count,
                invalidRows,
                duplicateCount = duplicateRows.Count,
                duplicateRows,
                note = "Chỉ xử lý 2 trường: Email và Họ và tên. Những hàng không hợp lệ sẽ được bỏ qua."
            };

            // Return summary + merged list
            var output = new List<object> { summary };
            output.AddRange(merged);
            return output;
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