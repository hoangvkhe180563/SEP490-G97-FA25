using System.Diagnostics;

namespace StudyHub.Backend.UseCases.Exceptions
{
    public class UseCaseException : Exception
    {
        //khi throw exception thì throw nó vào đây.
        //vd cách dùng: new UseCaseException("AppUserService", "không kết nối được DB").LogError();
        public string ErrorLocation { get; set; }
        public string ErrorMessage { get; set; }
        public UseCaseException(string location, string message) : base(message)
        {
            ErrorLocation = location;
            ErrorMessage = message;
        }

        public void LogError()
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Error in project Use Case!\nError in {ErrorLocation}!\nError message: {ErrorMessage}");
            Console.ResetColor();
        }
    }
}
