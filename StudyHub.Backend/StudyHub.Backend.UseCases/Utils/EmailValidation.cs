using System.Text.RegularExpressions;

namespace StudyHub.Backend.UseCases.Utils
{
    public static class EmailValidation
    {
        //các hàm xử lý logic chung.
        //là các thuật toán, constant, mã hóa
        public static bool IsValid(string? email)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;
            
            const string pattern = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";

            return Regex.IsMatch(email, pattern, RegexOptions.IgnoreCase);
        }
    }
}
