using System.Diagnostics;

namespace StudyHub.Backend.UseCases.Exceptions
{
    public class UseCaseException : Exception
    {
        //khi throw exception thì throw nó vào đây.
        //cách dùng: throw new UseCaseException("không add được user");
        public UseCaseException(string message) : base(message)
        {
            LogError(message);
        }

        private void LogError(string message)
        {
            string location = GetErrorLocation();
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Error in project {Source}!\nError message: {message}\nError location: {location}");
            Console.ResetColor();
        }

        private string GetErrorLocation()
        {
            var stackTrace = new StackTrace(true);
            StackFrame? frame = stackTrace.GetFrame(0);
            if (frame == null)
            {
                return "Unknown location";
            }
            int frameIndex = 1;
            while (true)
            {
                StackFrame? nextFrame = stackTrace.GetFrame(frameIndex);
                if (nextFrame != null)
                {
                    frame = nextFrame;
                }
                else
                {
                    break;
                }
                frameIndex++;
            }

            var fileName = frame.GetFileName();
            var lineNumber = frame.GetFileLineNumber();

            return string.IsNullOrEmpty(fileName)
                ? $"[Unknown file name]: Line {lineNumber}"
                : $"[{fileName}]: Line {lineNumber}";
        }
    }
}
