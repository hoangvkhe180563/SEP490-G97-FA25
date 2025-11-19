using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Exceptions
{
    public class InvalidImportFieldException : Exception
    {
        public Dictionary<string, List<string>> Errors { get; set; }

        public InvalidImportFieldException(Dictionary<string, List<string>> errors)
        {
            Errors = errors;
        }
    }
}
