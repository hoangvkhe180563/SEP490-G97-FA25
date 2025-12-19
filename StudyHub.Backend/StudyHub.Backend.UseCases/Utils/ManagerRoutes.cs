using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Utils
{
    public static class ManagerRoutes
    {
        // User management
        public const string UserIndex = "/user/manager";
        public const string UserAccounts = "/user/manager/accounts";
        public const string UserAccountRecoveries = "/user/manager/account-recoveries";

        // Class management
        public const string ClassDashboard = "/class/manager/dashboard-classes";
        public const string ClassManagement = "/class/manager/management-classes";

        // Exam management
        public const string ExamDashboard = "/exam/manager/dashboard";
        public const string ExamQuestions = "/exam/manager/questions";

        // Other manager pages
        public const string Recommend = "/recommend/manager";
        public const string QA = "/qa/manager";
        public const string QATopics = "/qa/manager/topics";

        // Financial
        public const string FinancialRevenue = "/payment/financial/revenue";

        // (Add more manager-specific routes here as needed)
    }
}
