using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Utils
{
    public static class TeacherRoutes
    {
        // Class
        public const string ClassIndex = "/class/teacher";
        public const string ClassDetail = "/class/teacher/{id}"; // replace {id} with class id

        // Course
        public const string CourseList = "/course/teacher/courses";
        public const string CourseDetail = "/course/teacher/courses/{id}"; // replace {id} with course id

        // Documents (teacher)
        public const string MyDocuments = "/document/teacher/my-documents";
        public const string Documents = "/document/teacher/documents";

        // (Add more teacher-specific routes here as needed)
    }
}
