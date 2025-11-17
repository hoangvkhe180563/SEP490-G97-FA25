using System;

namespace StudyHub.Backend.UseCases.Exceptions
{
    public class AccountInactiveException : Exception
    {
        public AccountInactiveException() : base("Tài khoản đã bị vô hiệu hóa") { }
    }
}
