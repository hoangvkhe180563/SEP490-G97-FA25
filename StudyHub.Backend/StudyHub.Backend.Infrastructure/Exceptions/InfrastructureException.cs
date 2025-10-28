using System.Diagnostics;

namespace StudyHub.Backend.Infrastructure.Exceptions
{
    public class InfrastructureException
    {
        public string ErrorLocation { get; set; }
        public string ErrorMessage { get; set; }
        public InfrastructureException(string location, string message)
        {
            ErrorLocation = location;
            ErrorMessage = message;
        }

        public void LogError()
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Error in project Infrastructure!\nError in {ErrorLocation}!\nError message: {ErrorMessage}");
            Console.ResetColor();
        }
    }
}
