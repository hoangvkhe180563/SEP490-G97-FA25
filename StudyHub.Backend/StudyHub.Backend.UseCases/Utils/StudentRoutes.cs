using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Utils
{
    public static class StudentRoutes
    {
        // Course
        public const string CourseList = "/course/student/courses";
        public const string CourseDetail = "/course/student/courses/{id}"; // replace {id} with course id

        // QA / Conversations
        public const string QAConversations = "/qa/student/conversations";
        public const string QAConversationDetail = "/qa/student/conversations/{id}"; // replace {id} with conversation id

        // Recommend
        public const string Recommend = "/recommend/student";

        // Payment / Wallet
        public const string Transactions = "/payment/student/transactions";
        public const string WalletTopup = "/payment/student/wallet/topup";
        public const string WalletWithdrawal = "/payment/student/wallet/withdrawal";

        // Class (student)
        public const string ClassIndex = "/class/student";
        public const string ClassDetail = "/class/student/{id}"; // replace {id} with class id

        // Generic documents (accessible to students)
        public const string Documents = "/document/documents";

        // (Add more student-specific routes here as needed)
    }
}
