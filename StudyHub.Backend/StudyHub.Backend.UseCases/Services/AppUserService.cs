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
        private readonly AuthService _authService;
        private const int SALT_ROUNDS = 12; // BCrypt salt rounds for hashing

        public AppUserService(IAppUserRepository userRepository, IAppRoleRepository roleRepository, IConfiguration configuration, StudyHub.Backend.UseCases.Repositories.ICloudinaryRepository cloudinary, AuthService authService)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
            _configuration = configuration;
            _cloudinary = cloudinary;
            _authService = authService;
        }

        // Export all accounts to an Excel file (EPPlus)
        public byte[] ExportAccountsToExcel()
        {
            var users = _userRepository.GetAllUsers();

            using (var pkg = new ExcelPackage())
            {
                var ws = pkg.Workbook.Worksheets.Add("Tất cả tài khoả");
                var lists = pkg.Workbook.Worksheets.Add("Danh sách điền");
                // headers (Vietnamese for user-facing template)
                ws.Cells[1, 1].Value = "Email";
                ws.Cells[1, 2].Value = "Tên người dùng";
                ws.Cells[1, 3].Value = "Họ và tên";
                ws.Cells[1, 4].Value = "Trạng thái";
                ws.Cells[1, 5].Value = "Vai trò";
                ws.Cells[1, 6].Value = "Ngày tạo";
                ws.Cells[1, 7].Value = "Số điện thoại";
                ws.Cells[1, 8].Value = "Địa chỉ";
                ws.Cells[1, 9].Value = "Mật khẩu";
                ws.Cells[1, 10].Value = "Ngày sinh";
                ws.Cells[1, 11].Value = "Giới tính"; // Nam / Nữ

                int row = 2;
                foreach (var u in users)
                {
                    var roles = _roleRepository.GetRolesForUser(u.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
                    ws.Cells[row, 1].Value = u.Email;
                    ws.Cells[row, 2].Value = u.Username;
                    ws.Cells[row, 3].Value = u.Fullname;
                    ws.Cells[row, 4].Value = u.Status == true ? "Có hiệu lực" : "Vô hiệu hoá";
                    ws.Cells[row, 5].Value = string.Join(", ", roles);
                    // CreatedAt and Dob as date values with desired format
                    ws.Cells[row, 6].Value = u.CreatedAt;
                    ws.Cells[row, 7].Value = u.PhoneNumber;
                    ws.Cells[row, 8].Value = u.Address;
                    // Dob may be DateOnly? or DateTime? attempt to format if available
                    try
                    {
                        if (u.Dob.HasValue)
                        {
                            ws.Cells[row, 10].Value = DateTime.Parse(u.Dob.Value.ToString());
                        }
                    }
                    catch { }
                    // Gender: store as 1 (true) or 0 (false)
                    try
                    {
                        ws.Cells[row, 11].Value = (u.Gender == true) ? "Nam" : "Nữ";
                    }
                    catch { ws.Cells[row, 11].Value = "0"; }

                    row++;
                }

                int lastDataRow = row - 1;

                // Instructions sheet (visible) - hướng dẫn bằng tiếng Việt
                var instr = pkg.Workbook.Worksheets.Add("Hướng dẫn");
                instr.Cells[1, 1].Value = "Hướng dẫn import";
                instr.Cells[2, 1].Value = "- Mục đích: Sử dụng file này để chuẩn bị dữ liệu tài khoản trước khi import.";
                instr.Cells[3, 1].Value = "- Vai trò: sử dụng tên vai trò trong sheet 'Danh sách điền'.";
                instr.Cells[4, 1].Value = "  1) Nhập 1 vai trò: ví dụ 'Subject Teacher'";
                instr.Cells[5, 1].Value = "  2) Nhập nhiều vai trò: ví dụ 'Subject Teacher, Homeroom Teacher'";
                instr.Cells[6, 1].Value = "- Ngày: định dạng dd/MM/yyyy (ví dụ: 23/10/2014)";
                instr.Cells[7, 1].Value = "- SĐT: định dạng Việt Nam, ví dụ: 0912345678 hoặc +84912345678";
                instr.Column(1).AutoFit();

                // Populate Lists sheet for dropdowns
                // Status
                lists.Cells[1, 1].Value = "Trạng thái";
                lists.Cells[2, 1].Value = "Có hiệu lực";
                lists.Cells[3, 1].Value = "Vô hiệu hoá";
                // Roles
                var allRoles = _roleRepository.GetAllRoles();
                lists.Cells[1, 2].Value = "Vai trò";
                int roleRow = 2;
                foreach (var r in allRoles)
                {
                    lists.Cells[roleRow++, 2].Value = r.Name;
                }
                if (roleRow == 1) { lists.Cells[1, 2].Value = "External Student"; roleRow = 2; }
                // Gender
                lists.Cells[1, 3].Value = "Giới tính";
                lists.Cells[2, 3].Value = "Nam";
                lists.Cells[3, 3].Value = "Nữ";

                // Apply validations and formats on main sheet
                if (lastDataRow >= 2)
                {
                    // Status validation
                    var statusVal = ws.DataValidations.AddListValidation(ws.Cells[2, 4, lastDataRow, 4].Address);
                    statusVal.Formula.ExcelFormula = "'Danh sách điền'!$A$1:$A$2";
                    statusVal.ShowErrorMessage = true;

                    ws.Cells[1, 5].AddComment("Ví dụ:\n1) Một vai trò: Subject Teacher\n2) Nhiều vai trò: Subject Teacher, Homeroom Teacher\nHoặc dùng ';' để phân tách các vai trò.", "System");

                    // Gender validation
                    var genderVal = ws.DataValidations.AddListValidation(ws.Cells[2, 11, lastDataRow, 11].Address);
                    genderVal.Formula.ExcelFormula = "'Danh sách điền'!$C$1:$C$2";
                    genderVal.ShowErrorMessage = true;

                    // Date formats
                    for (int r2 = 2; r2 <= lastDataRow; r2++)
                    {
                        ws.Cells[r2, 6].Style.Numberformat.Format = "dd/MM/yyyy";
                        ws.Cells[r2, 10].Style.Numberformat.Format = "dd/MM/yyyy";
                    }
                }

                // Comments
                ws.Cells[1, 6].AddComment("Date format: dd/MM/yyyy. E.g., 23/10/2014", "System");
                ws.Cells[1, 10].AddComment("Date format: dd/MM/yyyy. E.g., 23/10/2014", "System");
                ws.Cells[1, 7].AddComment("Định dạng theo số điện thoại Việt Nam: 0XXXXXXXXX or +84XXXXXXXXX", "System");

                // Hide lists sheet
                lists.Hidden = eWorkSheetHidden.Hidden;

                // auto-fit columns
                ws.Cells[ws.Dimension.Address].AutoFitColumns();
                return pkg.GetAsByteArray();
            }
        }

        // Export an Excel template to help users prepare import files
        public byte[] ExportImportTemplate(int rows = 1000)
        {
            if (rows <= 0) rows = 1000;

            var roles = _roleRepository.GetAllRoles();

            using (var pkg = new ExcelPackage())
            {
                // Main sheet
                var ws = pkg.Workbook.Worksheets.Add("Mẫu Import");
                // Hidden lists sheet
                var lists = pkg.Workbook.Worksheets.Add("Danh sách điền");

                // Headers
                ws.Cells[1, 1].Value = "Email";
                ws.Cells[1, 2].Value = "Tên người dùng";
                ws.Cells[1, 3].Value = "Họ và tên";
                ws.Cells[1, 4].Value = "Trạng thái";
                ws.Cells[1, 5].Value = "Vai trò";
                ws.Cells[1, 6].Value = "Ngày tạo";
                ws.Cells[1, 7].Value = "Số điện thoại";
                ws.Cells[1, 8].Value = "Địa chỉ";
                ws.Cells[1, 9].Value = "Mật khẩu";
                ws.Cells[1, 10].Value = "Ngày sinh";
                ws.Cells[1, 11].Value = "Giới tính";

                // Example row (hàng 2) — người dùng có thể copy nhanh mẫu này
                // Try to use real role names from DB; pick first two if available
                var exampleRolesList = roles.Take(2).Select(r => r.Name).Where(n => !string.IsNullOrEmpty(n)).ToList();
                var exampleRoles = exampleRolesList.Any() ? string.Join(", ", exampleRolesList) : "Subject Teacher, Homeroom Teacher";
                ws.Cells[2, 1].Value = "example@example.com";
                ws.Cells[2, 2].Value = "example.user";
                ws.Cells[2, 3].Value = "Nguyễn Văn A";
                ws.Cells[2, 4].Value = "Có hiệu lực";
                ws.Cells[2, 5].Value = exampleRoles;
                ws.Cells[2, 6].Value = DateTime.Now.ToString("dd/MM/yyyy");
                ws.Cells[2, 7].Value = "0912345678";
                ws.Cells[2, 8].Value = "123 Đường Lê Lợi";
                ws.Cells[2, 10].Value = "01/01/1990";
                ws.Cells[2, 11].Value = "Nam";

                // Fill Lists sheet
                // Status list (A)
                lists.Cells[1, 1].Value = "Trạng thái";
                lists.Cells[2, 1].Value = "Có hiệu lực";
                lists.Cells[3, 1].Value = "Vô hiệu hoá";

                // Instructions sheet (visible) - tiếng Việt
                var instr = pkg.Workbook.Worksheets.Add("Hướng dẫn");
                instr.Cells[1, 1].Value = "Hướng dẫn import";
                instr.Cells[2, 1].Value = "- Mục đích: Sử dụng file này để chuẩn bị dữ liệu tài khoản trước khi import.";
                instr.Cells[3, 1].Value = "- Vai trò: sử dụng tên vai trò trong sheet 'Danh sách điền'.";
                instr.Cells[4, 1].Value = "  1) Nhập 1 vai trò: ví dụ 'Subject Teacher'";
                instr.Cells[5, 1].Value = "  2) Nhập nhiều vai trò: ví dụ 'Subject Teacher, Homeroom Teacher'";
                instr.Cells[6, 1].Value = "- Ngày: định dạng dd/MM/yyyy (ví dụ: 23/10/2014)";
                instr.Cells[7, 1].Value = "- SĐT: định dạng Việt Nam, ví dụ: 0912345678 hoặc +84912345678";
                instr.Column(1).AutoFit();

                // Roles list (B)
                lists.Cells[1, 2].Value = "Vai trò";
                int roleRow = 2;
                foreach (var r in roles)
                {
                    lists.Cells[roleRow++, 2].Value = r.Name;
                }
                if (roleRow == 1) // ensure at least one entry
                {
                    lists.Cells[1, 2].Value = "External Student";
                    roleRow = 2;
                }

                // Gender list (C)
                lists.Cells[1, 3].Value = "Giới tính";
                lists.Cells[2, 3].Value = "Nam";
                lists.Cells[3, 3].Value = "Nữ";

                // For rows, add formats and validations
                int startRow = 2;
                int endRow = startRow + rows - 1;

                // Status validation -> lists!$A$1:$A$2
                var statusValidation = ws.DataValidations.AddListValidation(ws.Cells[startRow, 4, endRow, 4].Address);
                statusValidation.Formula.ExcelFormula = "'Danh sách điền'!$A$1:$A$2";
                statusValidation.ShowErrorMessage = true;

                // Note: Excel cannot natively append multiple selections; users should separate with commas or semicolons.
                ws.Cells[1, 5].AddComment("Ví dụ:\n1) Một vai trò: Subject Teacher\n2) Nhiều vai trò: Subject Teacher, Homeroom Teacher\nHoặc dùng ';' để phân tách các vai trò.", "System");

                // CreatedAt & Dob formatting (dd/MM/yyyy)
                for (int r = startRow; r <= endRow; r++)
                {
                    ws.Cells[r, 6].Style.Numberformat.Format = "dd/MM/yyyy";
                    ws.Cells[r, 10].Style.Numberformat.Format = "dd/MM/yyyy";
                }

                // Phone number validation (custom) - allow either leading 0 + 10 digits or +84 + 9 digits
                // Formula uses SUBSTITUTE to strip spaces
                var phoneFormula = "OR(AND(LEFT(SUBSTITUTE(G2,\" \" ,\"\"),1)=\"0\",LEN(SUBSTITUTE(G2,\" \" ,\"\"))=10),AND(LEFT(SUBSTITUTE(G2,\" \" ,\"\"),3)=\"+84\",LEN(SUBSTITUTE(G2,\" \" ,\"\"))=12))";
                var phoneValidation = ws.DataValidations.AddCustomValidation(ws.Cells[startRow, 7, endRow, 7].Address);
                phoneValidation.Formula.ExcelFormula = phoneFormula;
                phoneValidation.ShowErrorMessage = true;
                phoneValidation.Error = "Số điện thoại phải là số điện thoại Việt Nam (e.g. 0912345678 or +84912345678)";

                // Email validation (basic) - require '@' and '.' characters
                var emailFormula = "AND(ISNUMBER(FIND(\"@\",A2)),ISNUMBER(FIND(\".\",A2)))";
                var emailValidation = ws.DataValidations.AddCustomValidation(ws.Cells[startRow, 1, endRow, 1].Address);
                emailValidation.Formula.ExcelFormula = emailFormula;
                emailValidation.ShowErrorMessage = true;
                emailValidation.Error = "Nhập đúng định dạng email";

                // Gender validation -> lists!$C$1:$C$2
                var genderValidation = ws.DataValidations.AddListValidation(ws.Cells[startRow, 11, endRow, 11].Address);
                genderValidation.Formula.ExcelFormula = "'Danh sách điền'!$C$1:$C$2";
                genderValidation.ShowErrorMessage = true;

                // Add explanatory comments for certain columns
                ws.Cells[1, 1].AddComment("Nhập vào đúng định dạng email.", "System");
                ws.Cells[1, 6].AddComment("Định dạng ngày: dd/MM/yyyy. E.g., 23/10/2014", "System");
                ws.Cells[1, 10].AddComment("Định dạng ngày: dd/MM/yyyy. E.g., 23/10/2014", "System");
                ws.Cells[1, 7].AddComment("Đinh dạng số điện thoại Việt Nam: 0XXXXXXXXX or +84XXXXXXXXX", "System");

                // Freeze header row
                ws.View.FreezePanes(2, 1);

                // Auto-fit
                ws.Cells[1, 1, endRow, 10].AutoFitColumns();

                // Hide lists sheet
                lists.Hidden = eWorkSheetHidden.Hidden;

                return pkg.GetAsByteArray();
            }
        }

        // Import accounts from Excel provided as byte[] (API should convert uploads to base64 and send DTO)
        public ImportResultDto ImportAccountsFromExcel(byte[] fileBytes, string? originalFileName = null)
        {
            var result = new ImportResultDto();
            if (fileBytes == null || fileBytes.Length == 0)
            {
                result.Errors.Add("File không tìm thấy hoặc không có");
                return result;
            }

            using (var stream = new MemoryStream(fileBytes))
            using (var pkg = new ExcelPackage(stream))
            {
                var ws = pkg.Workbook.Worksheets.FirstOrDefault();
                if (ws == null)
                {
                    result.Errors.Add("Không tìm thấy worksheet trong file Excel");
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
                            rowFieldErrors["Email"].Add($"Hàng {row}: Email '{email}' đã tồn tại");
                        }

                        // Validate username uniqueness
                        if (!string.IsNullOrEmpty(username))
                        {
                            var existingByUsername = _userRepository.GetByUsername(username);
                            if (existingByUsername != null)
                            {
                                if (!rowFieldErrors.ContainsKey("Username")) rowFieldErrors["Username"] = new List<string>();
                                rowFieldErrors["Username"].Add($"Hàng {row}: Tên người dùng '{username}' đã tồn tại");
                            }
                        }

                        // Resolve roles and validate combinations
                        List<Guid> roleIds = new List<Guid>();
                        var roleNames = new List<string>();
                        if (!string.IsNullOrEmpty(rolesText))
                        {
                            var rnList = rolesText.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).Select(r => r.Trim()).Where(r => !string.IsNullOrEmpty(r)).ToList();

                            // Check for duplicate role names in the same cell (case-insensitive)
                            var dupes = rnList.GroupBy(x => x, StringComparer.OrdinalIgnoreCase).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
                            if (dupes.Any())
                            {
                                if (!rowFieldErrors.ContainsKey("RoleIds")) rowFieldErrors["RoleIds"] = new List<string>();
                                rowFieldErrors["RoleIds"].Add($"Hàng {row}: Danh sách vai trò không được chứa trùng lặp: {string.Join(", ", dupes)}");
                            }

                            // Resolve roles (use distinct values)
                            var distinctRoles = rnList.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                            foreach (var rn in distinctRoles)
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
                                    rowFieldErrors["RoleIds"].Add($"Hàng {row}: Vai trò '{rn}' không tồn tại");
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
                                rowFieldErrors["RoleIds"].Add($"Hàng {row}: Không thể thêm cùng lúc vai trò External Student và School Studen");
                            }

                            var studentRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "External Student", "School Student" };
                            var managerRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Teacher", "Manager", "Admin", "Moderator" };
                            bool hasStudent = roleNames.Any(n => studentRoles.Contains(n));
                            bool hasManager = roleNames.Any(role => managerRoles.Any(keyword => role.Contains(keyword, StringComparison.OrdinalIgnoreCase)));
                            if (hasStudent && hasManager)
                            {
                                if (!rowFieldErrors.ContainsKey("RoleIds")) rowFieldErrors["RoleIds"] = new List<string>();
                                rowFieldErrors["RoleIds"].Add($"Hàng {row}: Học sinh không thể cùng với vai trò quản lí (Teacher/Manager/Admin/Moderator)");
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
                                rowFieldErrors["CreatedAt"].Add($"Hàng {row}: Ngày tạo '{createdAtText}' không phải là ngày hợp lệ (mong đợi dd/MM/yyyy)");
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
                                rowFieldErrors["Dob"].Add($"Hàng {row}: Ngày sinh '{dobText}' không phải là ngày hợp lệ (mong đợi dd/MM/yyyy)");
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
                                rowFieldErrors["Gender"].Add($"Hàng {row}: Giới tính '{genderText}' không hợp lệ (mong đợi Nam/Nữ hoặc 1/0)");
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
                                rowFieldErrors["Status"].Add($"Hàng {row}: Trạng thái '{statusText}' không hợp lệ (mong đợi 'Có hiệu lực' hoặc 'Vô hiệu hoá')");
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
                                rowFieldErrors["PhoneNumber"].Add($"Hàng {row}: Số điện thoại '{phone}' không phải là số điện thoại Việt Nam");
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
                        result.FieldErrors["_general"].Add($"Hàng {row}: {ex.Message}");
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
                        result.FieldErrors["Email"].Add($"Hàng {r}: Email '{emailKey}' đã bị lặp trong file vừa tải lên (đồng thời trong hàng: {otherRows})");

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
                        result.FieldErrors["Username"].Add($"Hàng {r}: Tên người dùng '{usernameKey}' đã bị lặp trong file vừa tải lên (đồng thời trong hàng: {otherRows})");

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

            var myUserId = _authService.GetCurrentUser().Id;

            var (users, total, totalPages, pageResult, limitResult) = _userRepository.GetAppUsersBySearchAndFilter(status, role, search, page, limit, myUserId);

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
                    Subjects = (u.Subjects ?? new List<Domain.Entities.Subject>()).Select(s => new SubjectDto { Id = s.Id, Name = s.Name }).ToList(),
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

        // Return all teachers (matching the standard teacher role names)
        public List<AppUserListDto> GetTeachers()
        {
            var users = _userRepository.GetTeachers();
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
        public async Task<AppUser> CreateAccountAsync(string email, string password, string username, IEnumerable<Guid>? roleIds, int communeId, int schoolId, string? fullname = null, DateOnly? dob = null, IFormFile? avatarFile = null, int gender = 0, string? address = null, string? phoneNumber = null, IEnumerable<short>? subjectIds = null)
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
                IsVerified = true
            };
            if (errors.Count > 0)
            {
                throw new InvalidFieldException(errors);
            }

            try
            {
                _userRepository.CreateUser(user, roleIds, subjectIds);
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
        public async Task<AppUser?> EditAccountAsync(Guid id, string? email = null, string? username = null, string? fullname = null, DateOnly? dob = null, int? communeId = null, bool? status = null, IFormFile? avatarFile = null, int? gender = null, IEnumerable<Guid>? roleIds = null, int? schoolId = null, string? address = null, string? phoneNumber = null, IEnumerable<short>? subjectIds = null)
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
                _userRepository.UpdateUser(user, roleIds, subjectIds);

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
