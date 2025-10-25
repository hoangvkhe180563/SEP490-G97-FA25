using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Domain.Entities
{
    public class LessonResource
    {
        public int Id { get; set; }

        public string Url { get; set; } = null!;
    }
}
