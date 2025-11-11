namespace StudyHub.Backend.Infrastructure.MongoDb.Exceptions
{
    public class MongoDbException
    {
        public string ErrorLocation { get; set; }
        public string ErrorMessage { get; set; }
        public MongoDbException(string location, string message)
        {
            ErrorLocation = location;
            ErrorMessage = message;
        }

        public void LogError()
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Error in project MongoDb!\nError in {ErrorLocation}!\nError message: {ErrorMessage}");
            Console.ResetColor();
        }
    }
}
