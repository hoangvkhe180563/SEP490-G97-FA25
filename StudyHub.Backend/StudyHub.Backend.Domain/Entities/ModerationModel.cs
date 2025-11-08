using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public class ModerationModel
    {
        public string Name { get; set; } = "";
        public string ModelPath { get; set; } = "";
        public double Threshold { get; set; }
        public List<string> ViolationLabels { get; set; } = new();
        public string ViolationType { get; set; } = "";
    }
}
