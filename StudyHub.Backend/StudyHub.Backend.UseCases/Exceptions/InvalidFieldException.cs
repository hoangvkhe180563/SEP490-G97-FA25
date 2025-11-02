using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Exceptions
{
    public class InvalidFieldException : Exception
    {
        public Dictionary<string, string> Errors { get; set; }

        public InvalidFieldException(Dictionary<string, string> errors)
        {
            Errors = errors;
        }
    }
}
