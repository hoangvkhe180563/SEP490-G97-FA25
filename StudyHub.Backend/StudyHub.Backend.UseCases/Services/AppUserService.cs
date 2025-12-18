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
        private readonly LocationService _locationService;

        public AppUserService(IAppUserRepository userRepository, IAppRoleRepository roleRepository, IConfiguration configuration, StudyHub.Backend.UseCases.Repositories.ICloudinaryRepository cloudinary, AuthService authService, LocationService locationService)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
            _configuration = configuration;
            _cloudinary = cloudinary;
            _authService = authService;
            _locationService = locationService;
        }

        // Export all accounts to an Excel file (EPPlus)
        public byte[] ExportAccountsToExcel()
        {
            // Determine whether current user is Admin; admins export all accounts, others export only their school
            List<AppUser> users;
            try
            {
                var currentUser = _authService.GetCurrentUser();
                var importerRoles = _roleRepository.GetRolesForUser(currentUser.Id);
                var isAdmin = importerRoles != null && importerRoles.Any(r => string.Equals(r.Name, "Admin", StringComparison.OrdinalIgnoreCase));
                if (isAdmin)
                {
                    users = _userRepository.GetAllUsers();
                }
                else
                {
                    // use GetAppUsersBySearchAndFilter to filter by schoolId and get all rows
                    var (uList, _, _, _, _) = _userRepository.GetAppUsersBySearchAndFilter(null, null, null, 1, int.MaxValue, currentUser.Id, currentUser.SchoolId);
                    users = uList ?? new List<AppUser>();
                }
            }
            catch
            {
                users = _userRepository.GetAllUsers();
            }

            using (var pkg = new ExcelPackage())
            {
                var ws = pkg.Workbook.Worksheets.Add("Tất cả tài khoả");
                var lists = pkg.Workbook.Worksheets.Add("Danh sách điền");
                // headers (Vietnamese for user-facing template)
                ws.Cells[1, 1].Value = "Trường";
                ws.Cells[1, 2].Value = "Email";
                ws.Cells[1, 3].Value = "Tên người dùng";
                ws.Cells[1, 4].Value = "Họ và tên";
                ws.Cells[1, 5].Value = "Trạng thái";
                ws.Cells[1, 6].Value = "Vai trò";
                ws.Cells[1, 7].Value = "Ngày tạo";
                ws.Cells[1, 8].Value = "Số điện thoại";
                ws.Cells[1, 9].Value = "Địa chỉ";
                ws.Cells[1, 10].Value = "Mật khẩu";
                ws.Cells[1, 11].Value = "Ngày sinh";
                ws.Cells[1, 12].Value = "Giới tính"; // Nam / Nữ
                ws.Cells[1, 12].Value = "Trường";

                int row = 2;
                foreach (var u in users)
                {
                    var roles = _roleRepository.GetRolesForUser(u.Id).Where(r => !string.IsNullOrEmpty(r.Name)).Select(r => r.Name!).ToList();
                    ws.Cells[row, 1].Value = u.Email;
                    // School first
                    try { ws.Cells[row, 1].Value = _locationService.GetSchoolById(u.SchoolId)?.Name; } catch { }
                    ws.Cells[row, 2].Value = u.Email;
                    ws.Cells[row, 3].Value = u.Username;
                    ws.Cells[row, 4].Value = u.Fullname;
                    ws.Cells[row, 5].Value = u.Status == true ? "Có hiệu lực" : "Vô hiệu hoá";
                    ws.Cells[row, 6].Value = string.Join(", ", roles);
                    // CreatedAt and Dob as date values with desired format
                    ws.Cells[row, 7].Value = u.CreatedAt;
                    ws.Cells[row, 8].Value = u.PhoneNumber;
                    ws.Cells[row, 9].Value = u.Address;
                    // Dob may be DateOnly? or DateTime? attempt to format if available (now column 11)
                    try
                    {
                        if (u.Dob.HasValue)
                        {
                            ws.Cells[row, 11].Value = DateTime.Parse(u.Dob.Value.ToString());
                        }
                    }
                    catch { }
                    // Gender (now column 12)
                    try
                    {
                        ws.Cells[row, 12].Value = (u.Gender == true) ? "Nam" : "Nữ";
                    }
                    catch { ws.Cells[row, 12].Value = "0"; }
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
                    // Status validation (now column 5)
                    var statusVal = ws.DataValidations.AddListValidation(ws.Cells[2, 5, lastDataRow, 5].Address);
                    statusVal.Formula.ExcelFormula = "'Danh sách điền'!$A$1:$A$2";
                    statusVal.ShowErrorMessage = true;

                    ws.Cells[1, 6].AddComment("Ví dụ:\n1) Một vai trò: Subject Teacher\n2) Nhiều vai trò: Subject Teacher, Homeroom Teacher\nHoặc dùng ';' để phân tách các vai trò.", "System");

                    // Gender validation (now column 12)
                    var genderVal = ws.DataValidations.AddListValidation(ws.Cells[2, 12, lastDataRow, 12].Address);
                    genderVal.Formula.ExcelFormula = "'Danh sách điền'!$C$1:$C$2";
                    genderVal.ShowErrorMessage = true;

                    // Date formats (CreatedAt now col7, Dob now col11)
                    for (int r2 = 2; r2 <= lastDataRow; r2++)
                    {
                        ws.Cells[r2, 7].Style.Numberformat.Format = "dd/MM/yyyy";
                        ws.Cells[r2, 11].Style.Numberformat.Format = "dd/MM/yyyy";
                    }
                }

                // Comments
                ws.Cells[1, 7].AddComment("Date format: dd/MM/yyyy. E.g., 23/10/2014", "System");
                ws.Cells[1, 11].AddComment("Date format: dd/MM/yyyy. E.g., 23/10/2014", "System");
                ws.Cells[1, 8].AddComment("Định dạng theo số điện thoại Việt Nam: 0XXXXXXXXX or +84XXXXXXXXX", "System");

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
                // 1. Main sheet
                var ws = pkg.Workbook.Worksheets.Add("Mẫu Import");
                // 2. Hidden lists sheet
                var lists = pkg.Workbook.Worksheets.Add("Danh sách điền");

                // --- HEADERS ---
                ws.Cells[1, 1].Value = "Trường";
                ws.Cells[1, 2].Value = "Email";
                ws.Cells[1, 3].Value = "Tên người dùng";
                ws.Cells[1, 4].Value = "Họ và tên";
                ws.Cells[1, 5].Value = "Trạng thái";
                ws.Cells[1, 6].Value = "Vai trò";
                ws.Cells[1, 7].Value = "Ngày tạo";
                ws.Cells[1, 8].Value = "Số điện thoại";
                ws.Cells[1, 9].Value = "Địa chỉ";
                ws.Cells[1, 10].Value = "Mật khẩu";
                ws.Cells[1, 11].Value = "Ngày sinh";
                ws.Cells[1, 12].Value = "Giới tính";

                // --- EXAMPLE ROW (Row 2) ---
                var exampleRolesList = roles.Take(2).Select(r => r.Name).Where(n => !string.IsNullOrEmpty(n)).ToList();
                var exampleRoles = exampleRolesList.Any() ? string.Join(", ", exampleRolesList) : "Subject Teacher, Homeroom Teacher";

                ws.Cells[2, 1].Value = "THPT Hà Nội";
                ws.Cells[2, 2].Value = "example@example.com";
                ws.Cells[2, 3].Value = "example.user";
                ws.Cells[2, 4].Value = "Nguyễn Văn A";
                ws.Cells[2, 5].Value = "Có hiệu lực";
                ws.Cells[2, 6].Value = exampleRoles;
                ws.Cells[2, 7].Value = DateTime.Now.ToString("dd/MM/yyyy");
                ws.Cells[2, 8].Value = "0912345678";
                ws.Cells[2, 9].Value = "123 Đường Lê Lợi";
                ws.Cells[2, 10].Value = "Password123"; // Ví dụ mật khẩu
                ws.Cells[2, 11].Value = "01/01/1990";
                ws.Cells[2, 12].Value = "Nam";

                // --- PREPARE HIDDEN LISTS ---

                // A. Status list
                lists.Cells[1, 1].Value = "Trạng thái";
                lists.Cells[2, 1].Value = "Có hiệu lực";
                lists.Cells[3, 1].Value = "Vô hiệu hoá";

                // B. Roles list
                lists.Cells[1, 2].Value = "Vai trò";
                int roleRow = 2;
                foreach (var r in roles)
                {
                    lists.Cells[roleRow++, 2].Value = r.Name;
                }
                if (roleRow == 2) // fallback if empty
                {
                    lists.Cells[2, 2].Value = "External Student";
                    roleRow++;
                }

                // C. Gender list
                lists.Cells[1, 3].Value = "Giới tính";
                lists.Cells[2, 3].Value = "Nam";
                lists.Cells[3, 3].Value = "Nữ";

                // D. Schools list
                lists.Cells[1, 4].Value = "Trường";
                int schoolListRow = 2;

                var schoolsForList = _locationService.GetAllSchools();
                if (schoolsForList != null && schoolsForList.Any())
                {
                    foreach (var s in schoolsForList)
                    {
                        lists.Cells[schoolListRow++, 4].Value = s.Name;
                    }
                }

                // --- INSTRUCTIONS SHEET ---
                var instr = pkg.Workbook.Worksheets.Add("Hướng dẫn");
                instr.Cells[1, 1].Value = "Hướng dẫn import";
                instr.Cells[2, 1].Value = "- Mục đích: Sử dụng file này để chuẩn bị dữ liệu tài khoản trước khi import.";
                instr.Cells[3, 1].Value = "- Vai trò: sử dụng tên vai trò trong sheet 'Danh sách điền'.";
                instr.Cells[4, 1].Value = "  1) Nhập 1 vai trò: ví dụ 'Subject Teacher'";
                instr.Cells[5, 1].Value = "  2) Nhập nhiều vai trò: ví dụ 'Subject Teacher, Homeroom Teacher'";
                instr.Cells[6, 1].Value = "- Ngày: định dạng dd/MM/yyyy (ví dụ: 23/10/2014)";
                instr.Cells[7, 1].Value = "- SĐT: định dạng Việt Nam, ví dụ: 0912345678 hoặc +84912345678";
                instr.Column(1).AutoFit();

                // --- VALIDATIONS & FORMATTING ---
                int startRow = 2;
                int endRow = startRow + rows - 1;


                // 2. Validation Email (Cột 2) -> Custom Formula (Check @ and .)
                // Formula applies to B2 relative
                var emailFormula = "AND(ISNUMBER(FIND(\"@\",B2)),ISNUMBER(FIND(\".\",B2)))";
                var emailValidation = ws.DataValidations.AddCustomValidation(ws.Cells[startRow, 2, endRow, 2].Address);
                emailValidation.Formula.ExcelFormula = emailFormula;
                emailValidation.ShowErrorMessage = true;
                emailValidation.Error = "Nhập đúng định dạng email (ví dụ: abc@domain.com)";

                // 3. Validation Trạng thái (Cột 5) -> List A
                var statusValidation = ws.DataValidations.AddListValidation(ws.Cells[startRow, 5, endRow, 5].Address);
                statusValidation.Formula.ExcelFormula = "'Danh sách điền'!$A$2:$A$3";
                statusValidation.ShowErrorMessage = true;
                statusValidation.Error = "Vui lòng chọn trạng thái từ danh sách.";

                // 4. Comment cho Vai trò (Cột 6)
                ws.Cells[1, 6].AddComment("Ví dụ:\n1) Một vai trò: Subject Teacher\n2) Nhiều vai trò: Subject Teacher, Homeroom Teacher\nHoặc dùng ';' để phân tách.", "System");

                // 5. Format ngày tháng (Cột 7: Ngày tạo & Cột 11: Ngày sinh)
                for (int r = startRow; r <= endRow; r++)
                {
                    ws.Cells[r, 7].Style.Numberformat.Format = "dd/MM/yyyy";  // Cột 7: Ngày tạo
                    ws.Cells[r, 11].Style.Numberformat.Format = "dd/MM/yyyy"; // Cột 11: Ngày sinh
                }

                // Comment Header cho cột ngày
                ws.Cells[1, 7].AddComment("Định dạng ngày: dd/MM/yyyy. Vd: 23/10/2024", "System");
                ws.Cells[1, 11].AddComment("Định dạng ngày: dd/MM/yyyy. Vd: 01/01/1990", "System");

                // 6. Validation Số điện thoại (Cột 8) -> Custom Formula
                // Cột 8 là cột H. Logic: 10 số bắt đầu bằng 0 HOẶC 12 ký tự bắt đầu bằng +84
                var phoneFormula = "OR(AND(LEFT(SUBSTITUTE(H2,\" \" ,\"\"),1)=\"0\",LEN(SUBSTITUTE(H2,\" \" ,\"\"))=10),AND(LEFT(SUBSTITUTE(H2,\" \" ,\"\"),3)=\"+84\",LEN(SUBSTITUTE(H2,\" \" ,\"\"))=12))";
                var phoneValidation = ws.DataValidations.AddCustomValidation(ws.Cells[startRow, 8, endRow, 8].Address);
                phoneValidation.Formula.ExcelFormula = phoneFormula;
                phoneValidation.ShowErrorMessage = true;
                phoneValidation.Error = "SĐT phải là số Việt Nam (Vd: 0912345678 hoặc +84912345678)";

                ws.Cells[1, 8].AddComment("Đinh dạng: 0XXXXXXXXX hoặc +84XXXXXXXXX", "System");
                ws.Cells[1, 2].AddComment("Nhập vào đúng định dạng email.", "System"); // Comment cho Email (Cột 2)

                // 7. Validation Giới tính (Cột 12) -> List C
                var genderValidation = ws.DataValidations.AddListValidation(ws.Cells[startRow, 12, endRow, 12].Address);
                genderValidation.Formula.ExcelFormula = "'Danh sách điền'!$C$2:$C$3";
                genderValidation.ShowErrorMessage = true;
                genderValidation.Error = "Chọn Nam hoặc Nữ";

                // --- FINALIZE ---

                // Freeze header row
                ws.View.FreezePanes(2, 1);

                // Auto-fit columns
                ws.Cells[1, 1, endRow, 12].AutoFitColumns();

                // Hide lists sheet
                lists.Hidden = eWorkSheetHidden.Hidden;

                return pkg.GetAsByteArray();
            }
        }

        public ImportResultDto ImportAccountsFromExcel(byte[] fileBytes, string? originalFileName = null)
        {
            var result = new ImportResultDto();
            if (fileBytes == null || fileBytes.Length == 0)
            {
                result.Errors.Add("File không tìm thấy hoặc không có dữ liệu");
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

                // --- LẤY THÔNG TIN TRƯỜNG CỦA NGƯỜI ĐANG IMPORT ---
                var currentUser = _authService.GetCurrentUser();
                string? currentSchoolName = null;
                bool isImporterAdmin = false;
                try
                {
                    if (currentUser.SchoolId.HasValue)
                    {
                        currentSchoolName = _locationService.GetSchoolById(currentUser.SchoolId.Value)?.Name;
                    }
                    try
                    {
                        var importerRoles = _roleRepository.GetRolesForUser(currentUser.Id);
                        if (importerRoles != null && importerRoles.Any(r => string.Equals(r.Name, "Admin", StringComparison.OrdinalIgnoreCase)))
                        {
                            isImporterAdmin = true;
                        }
                    }
                    catch { isImporterAdmin = false; }
                }
                catch { currentSchoolName = null; }

                // Helper chuẩn hóa chuỗi (bỏ dấu, lowercase, bỏ khoảng trắng) để so sánh
                static string NormalizeTextLocal(string? s)
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

                var usersWithRoles = new List<(AppUser user, IEnumerable<Guid>? roleIds, int Row)>();

                // Dictionary để check trùng lặp nội bộ trong file
                var emailRows = new Dictionary<string, List<int>>(StringComparer.OrdinalIgnoreCase);
                var usernameRows = new Dictionary<string, List<int>>(StringComparer.OrdinalIgnoreCase);

                int row = 2; // Bắt đầu từ dòng 2

                while (true)
                {
                    // Kiểm tra Email (Cột 2) để xác định dòng có dữ liệu
                    var email = ws.Cells[row, 2].Text?.Trim();
                    if (string.IsNullOrEmpty(email)) break;

                    result.TotalRows++;

                    // Check trùng email nội bộ
                    if (!emailRows.ContainsKey(email)) emailRows[email] = new List<int>();
                    emailRows[email].Add(row);

                    // Lấy Username (Cột 3)
                    var username = ws.Cells[row, 3].Text?.Trim();
                    var usernameForDupCheck = string.IsNullOrEmpty(username) ? email : username;
                    if (!usernameRows.ContainsKey(usernameForDupCheck)) usernameRows[usernameForDupCheck] = new List<int>();
                    usernameRows[usernameForDupCheck].Add(row);

                    // Lấy dữ liệu các cột
                    var schoolName = ws.Cells[row, 1].Text?.Trim();     // Col 1: Trường
                    var fullname = ws.Cells[row, 4].Text?.Trim();     // Col 4: Họ tên
                    var statusText = ws.Cells[row, 5].Text?.Trim();     // Col 5: Trạng thái
                    var rolesText = ws.Cells[row, 6].Text?.Trim();     // Col 6: Vai trò
                    var createdAtText = ws.Cells[row, 7].Text?.Trim();  // Col 7: Ngày tạo
                    var phone = ws.Cells[row, 8].Text?.Trim();     // Col 8: SĐT
                    var address = ws.Cells[row, 9].Text?.Trim();     // Col 9: Địa chỉ
                    var passwordRaw = ws.Cells[row, 10].Text?.Trim();   // Col 10: Mật khẩu
                    var dobText = ws.Cells[row, 11].Text?.Trim();    // Col 11: Ngày sinh
                    var genderText = ws.Cells[row, 12].Text?.Trim();    // Col 12: Giới tính

                    var rowFieldErrors = new Dictionary<string, List<string>>();

                    try
                    {
                        // 1. VALIDATE TRƯỜNG (SCHOOL CHECK) - YÊU CẦU 1
                        // Nếu người import thuộc một trường cụ thể (và không phải Admin), bắt buộc file excel phải nhập đúng trường đó
                        if (!isImporterAdmin && !string.IsNullOrEmpty(currentSchoolName))
                        {
                            var normalizedCell = NormalizeTextLocal(schoolName);
                            var normalizedCurrent = NormalizeTextLocal(currentSchoolName);

                            if (string.IsNullOrEmpty(normalizedCell))
                            {
                                if (!rowFieldErrors.ContainsKey("School")) rowFieldErrors["School"] = new List<string>();
                                rowFieldErrors["School"].Add($"Hàng {row}: Vui lòng điền tên trường '{currentSchoolName}' vào cột Trường.");
                            }
                            else if (!string.Equals(normalizedCell, normalizedCurrent, StringComparison.OrdinalIgnoreCase))
                            {
                                if (!rowFieldErrors.ContainsKey("School")) rowFieldErrors["School"] = new List<string>();
                                rowFieldErrors["School"].Add($"Hàng {row}: Tên trường '{schoolName}' không khớp. Bạn chỉ có quyền import vào trường '{currentSchoolName}'.");
                            }
                        }

                        // 2. Validate Email (DB Check)
                        var existingByEmail = _userRepository.GetByEmail(email);
                        if (existingByEmail != null)
                        {
                            if (!rowFieldErrors.ContainsKey("Email")) rowFieldErrors["Email"] = new List<string>();
                            rowFieldErrors["Email"].Add($"Hàng {row}: Email '{email}' đã tồn tại trong hệ thống.");
                        }

                        // 3. Validate Username (DB Check)
                        if (!string.IsNullOrEmpty(username))
                        {
                            var existingByUsername = _userRepository.GetByUsername(username);
                            if (existingByUsername != null)
                            {
                                if (!rowFieldErrors.ContainsKey("Username")) rowFieldErrors["Username"] = new List<string>();
                                rowFieldErrors["Username"].Add($"Hàng {row}: Username '{username}' đã tồn tại trong hệ thống.");
                            }
                        }

                        // 4. VALIDATE ROLES - YÊU CẦU 2 (Cấm ADMIN & EXTERNAL STUDENT)
                        List<Guid> roleIds = new List<Guid>();
                        var roleNames = new List<string>(); // Để check logic mâu thuẫn bên dưới
                        if (!string.IsNullOrEmpty(rolesText))
                        {
                            var rnList = rolesText.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
                                                  .Select(r => r.Trim())
                                                  .Where(r => !string.IsNullOrEmpty(r))
                                                  .ToList();

                            var distinctRoles = rnList.Distinct(StringComparer.OrdinalIgnoreCase).ToList();

                            foreach (var rn in distinctRoles)
                            {
                                // --- CHECK CẤM ROLE ADMIN & EXTERNAL STUDENT (skip when importer is Admin) ---
                                if (!isImporterAdmin && (string.Equals(rn, "Admin", StringComparison.OrdinalIgnoreCase) ||
                                    string.Equals(rn, "External Student", StringComparison.OrdinalIgnoreCase)))
                                {
                                    if (!rowFieldErrors.ContainsKey("RoleIds")) rowFieldErrors["RoleIds"] = new List<string>();
                                    rowFieldErrors["RoleIds"].Add($"Hàng {row}: Không được phép import vai trò '{rn}'.");
                                    continue; // Bỏ qua việc tìm ID role này
                                }
                                // ------------------------------------------------

                                var role = _roleRepository.GetRoleByName(rn);
                                if (role != null)
                                {
                                    roleIds.Add(role.Id);
                                    roleNames.Add(role.Name);
                                }
                                else
                                {
                                    if (!rowFieldErrors.ContainsKey("RoleIds")) rowFieldErrors["RoleIds"] = new List<string>();
                                    rowFieldErrors["RoleIds"].Add($"Hàng {row}: Vai trò '{rn}' không tồn tại trong hệ thống.");
                                }
                            }
                        }

                        // Validate Logic Roles (Mâu thuẫn vai trò)
                        if (roleNames.Any())
                        {
                            var studentRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "School Student" }; // External Student đã bị chặn ở trên
                            var managerRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Teacher", "Manager", "Moderator", "Subject Teacher", "Homeroom Teacher" };

                            bool hasStudent = roleNames.Any(n => studentRoles.Contains(n));
                            bool hasManager = roleNames.Any(role => managerRoles.Any(m => role.Contains(m, StringComparison.OrdinalIgnoreCase)));

                            if (hasStudent && hasManager)
                            {
                                if (!rowFieldErrors.ContainsKey("RoleIds")) rowFieldErrors["RoleIds"] = new List<string>();
                                rowFieldErrors["RoleIds"].Add($"Hàng {row}: Không thể gán vai trò Học sinh cùng với Quản lý/Giáo viên.");
                            }
                        }

                        // 5. Validate CreatedAt
                        DateTime? createdAt = null;
                        if (!string.IsNullOrEmpty(createdAtText))
                        {
                            if (DateTime.TryParseExact(createdAtText, new[] { "dd/MM/yyyy", "d/M/yyyy" }, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
                                createdAt = parsed;
                            else
                            {
                                if (!rowFieldErrors.ContainsKey("CreatedAt")) rowFieldErrors["CreatedAt"] = new List<string>();
                                rowFieldErrors["CreatedAt"].Add($"Hàng {row}: Ngày tạo sai định dạng (yêu cầu dd/MM/yyyy).");
                            }
                        }

                        // 6. Validate Dob
                        DateOnly? dob = null;
                        if (!string.IsNullOrEmpty(dobText))
                        {
                            if (DateOnly.TryParseExact(dobText, new[] { "dd/MM/yyyy", "d/M/yyyy" }, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dExact))
                                dob = dExact;
                            else if (DateTime.TryParse(dobText, out var dt))
                                dob = DateOnly.FromDateTime(dt);
                            else
                            {
                                if (!rowFieldErrors.ContainsKey("Dob")) rowFieldErrors["Dob"] = new List<string>();
                                rowFieldErrors["Dob"].Add($"Hàng {row}: Ngày sinh sai định dạng (yêu cầu dd/MM/yyyy).");
                            }
                        }

                        // 7. Validate Phone (VN)
                        if (!string.IsNullOrEmpty(phone))
                        {
                            var phoneNorm = phone.Replace(" ", "").Trim();
                            var phoneRegex = new Regex(@"^(\+84|0)(3|5|7|8|9)\d{8}$");
                            if (!phoneRegex.IsMatch(phoneNorm))
                            {
                                if (!rowFieldErrors.ContainsKey("PhoneNumber")) rowFieldErrors["PhoneNumber"] = new List<string>();
                                rowFieldErrors["PhoneNumber"].Add($"Hàng {row}: SĐT không hợp lệ (VN).");
                            }
                        }

                        // 8. Validate Gender / Status
                        bool? genderBool = null;
                        if (!string.IsNullOrEmpty(genderText))
                        {
                            var gNorm = NormalizeTextLocal(genderText);
                            if (gNorm.Contains("nam") || gNorm == "1") genderBool = true;
                            else if (gNorm.Contains("nu") || gNorm == "0") genderBool = false;
                            else
                            {
                                if (!rowFieldErrors.ContainsKey("Gender")) rowFieldErrors["Gender"] = new List<string>();
                                rowFieldErrors["Gender"].Add($"Hàng {row}: Giới tính không hợp lệ.");
                            }
                        }

                        bool? statusBool = null;
                        if (!string.IsNullOrEmpty(statusText))
                        {
                            var sNorm = NormalizeTextLocal(statusText);
                            if (sNorm.Contains("cohieu") || sNorm == "active") statusBool = true;
                            else if (sNorm.Contains("vohieu") || sNorm == "inactive") statusBool = false;
                            else
                            {
                                if (!rowFieldErrors.ContainsKey("Status")) rowFieldErrors["Status"] = new List<string>();
                                rowFieldErrors["Status"].Add($"Hàng {row}: Trạng thái không hợp lệ.");
                            }
                        }

                        // --- TỔNG HỢP LỖI DÒNG ---
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

                        // --- TẠO OBJECT USER ---
                        // Determine assigned SchoolId: if importer is Admin, allow using the 'Trường' column value
                        int? assignedSchoolId = currentUser.SchoolId;
                        if (isImporterAdmin && !string.IsNullOrEmpty(schoolName))
                        {
                            try
                            {
                                var allSchools = _locationService.GetAllSchools();
                                if (allSchools != null)
                                {
                                    var target = allSchools.FirstOrDefault(s => NormalizeTextLocal(s.Name) == NormalizeTextLocal(schoolName));
                                    if (target != null) assignedSchoolId = target.Id;
                                    else assignedSchoolId = null; // leave null if not found
                                }
                            }
                            catch { assignedSchoolId = null; }
                        }

                        var newUser = new AppUser
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
                            Gender = genderBool ?? true,
                            SchoolId = assignedSchoolId // Gán SchoolId (Admin importer may set via Trường column)
                        };

                        if (dob.HasValue) newUser.Dob = dob.Value;

                        if (!string.IsNullOrEmpty(passwordRaw))
                            newUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(passwordRaw, SALT_ROUNDS);
                        else
                            newUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(_configuration["DefaultImportPassword"] ?? "12345", SALT_ROUNDS);

                        usersWithRoles.Add((newUser, roleIds.Count > 0 ? roleIds : null, row));
                    }
                    catch (Exception ex)
                    {
                        result.Failed++;
                        if (!result.FieldErrors.ContainsKey("_general")) result.FieldErrors["_general"] = new List<string>();
                        result.FieldErrors["_general"].Add($"Hàng {row}: Lỗi - {ex.Message}");
                    }

                    row++;
                }

                // --- CHECK TRÙNG LẶP TRONG FILE ---
                foreach (var kv in emailRows.Where(kv => kv.Value.Count > 1))
                {
                    var emailKey = kv.Key;
                    var rows = kv.Value;
                    if (!result.FieldErrors.ContainsKey("Email")) result.FieldErrors["Email"] = new List<string>();
                    result.FieldErrors["Email"].Add($"Email '{emailKey}' bị trùng tại các hàng: {string.Join(", ", rows)}");

                    var found = usersWithRoles.Where(u => rows.Contains(u.Row)).ToList();
                    foreach (var f in found) { usersWithRoles.Remove(f); result.Failed++; }
                }

                foreach (var kv in usernameRows.Where(kv => kv.Value.Count > 1))
                {
                    var userKey = kv.Key;
                    var rows = kv.Value;
                    if (!result.FieldErrors.ContainsKey("Username")) result.FieldErrors["Username"] = new List<string>();
                    result.FieldErrors["Username"].Add($"Username '{userKey}' bị trùng tại các hàng: {string.Join(", ", rows)}");

                    var found = usersWithRoles.Where(u => rows.Contains(u.Row)).ToList();
                    foreach (var f in found)
                    {
                        if (usersWithRoles.Contains(f)) { usersWithRoles.Remove(f); result.Failed++; }
                    }
                }

                if (result.FieldErrors.Any())
                {
                    throw new InvalidImportFieldException(result.FieldErrors);
                }

                if (usersWithRoles.Any())
                {
                    _userRepository.CreateUsersWithRoles(usersWithRoles.Select(u => (u.user, u.roleIds)));
                    result.Imported = usersWithRoles.Count;
                }
            }

            return result;
        }

        public PagedResult<AppUserListDto> GetAppUsers(string? status, string? role, string? search, int page, int limit, int? schoolId = null)
        {

            var myUserId = _authService.GetCurrentUser().Id;

            var (users, total, totalPages, pageResult, limitResult) = _userRepository.GetAppUsersBySearchAndFilter(status, role, search, page, limit, myUserId, schoolId);

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
                    SchoolName = _locationService.GetSchoolById(u.SchoolId)?.Name,
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
