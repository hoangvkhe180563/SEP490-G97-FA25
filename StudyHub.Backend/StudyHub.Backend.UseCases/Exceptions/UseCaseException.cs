namespace StudyHub.Backend.UseCases.Exceptions
{
    public class UseCaseException
    {
        public string ErrorLocation { get; set; }
        public string ErrorMessage { get; set; }
        public UseCaseException(string location, string message)
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
