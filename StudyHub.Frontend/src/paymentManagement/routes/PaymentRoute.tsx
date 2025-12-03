import { Outlet, type RouteObject } from "react-router-dom";
import RequireRole from "@/common/components/RequireRole";
import PaymentRouteConfig from "../constants/PaymentRouteConfig";
import TransactionList from "../pages/manager/TransactionList";
import RevenueReport from "../pages/manager/RevenueReport";
import PaymentCheckout from "../pages/student/PaymentCheckout";
import WalletTopUp from "../pages/student/WalletTopUp";
import SubscriptionPage from "../pages/student/SubscriptionPage";
import WithdrawRequest from "../pages/student/WithdrawRequest";
import PaymentSuccess from "../pages/student/PaymentSuccess";
import PaymentFailed from "../pages/student/PaymentFailed";
import TransactionHistory from "../pages/student/TransactionHistory";
import { ROLES } from "@/common/constants/Roles";

const financialManagerRoutes: RouteObject[] = [
  {
    path: PaymentRouteConfig.FINANCIAL_MANAGER.TRANSACTION,
    element: (
      <RequireRole allowedRoles={[ROLES.FINANCIAL_MANAGER]}>
        <TransactionList />
      </RequireRole>
    ),
  },
  {
    path: PaymentRouteConfig.FINANCIAL_MANAGER.REVENUE,
    element: (
      <RequireRole allowedRoles={[ROLES.FINANCIAL_MANAGER, ROLES.SCHOOL_ADMIN]}>
        <RevenueReport />
      </RequireRole>
    ),
  },
];

// --- STUDENT ROUTES (Đường dẫn con cho /) ---
const studentCourseRoutes: RouteObject[] = [
  // Lưu ý: Không có 'index' element ở đây vì 'index' route thường là trang Home/Dashboard (nếu không được định nghĩa rõ ràng)
  // Trong mẫu của bạn, routes học sinh bắt đầu bằng /courses

  {
    // subscription page for QA packages
    path: PaymentRouteConfig.STUDENT.SUBSCRIPTION,
    element: <SubscriptionPage />,
  },
  {
    // payments checkout
    path: PaymentRouteConfig.STUDENT.PAYMENT_CHECKOUT,
    element: <PaymentCheckout />,
  },
  {
    // wallet top-up
    path: PaymentRouteConfig.STUDENT.WALLET_TOPUP,
    element: <WalletTopUp />,
  },
  {
    // wallet withdrawal
    path: PaymentRouteConfig.STUDENT.WALLET_WITHDRAWAL,
    element: <WithdrawRequest />,
  },
  {
    // path="payment-success" element={<PaymentSuccess />}
    path: PaymentRouteConfig.STUDENT.PAYMENT_SUCCESS,
    element: <PaymentSuccess />,
  },
  {
    // payment failed page
    path: PaymentRouteConfig.STUDENT.PAYMENT_FAILED,
    element: <PaymentFailed />,
  },
  {
    // student transaction history
    path: PaymentRouteConfig.STUDENT.TRANSACTION_HISTORY,
    element: <TransactionHistory />,
  },
];

// --- ROOT ROUTES ---
const paymentRoutes: RouteObject[] = [
  // Cấu hình routes cho Học sinh (Base path: /)
  {
    path: PaymentRouteConfig.STUDENT.INDEX,
    element: (
      <RequireRole
        allowedRoles={[ROLES.SCHOOL_STUDENT, ROLES.EXTERNAL_STUDENT]}
      >
        <Outlet />
      </RequireRole>
    ),
    children: studentCourseRoutes,
  },
  // Cấu hình routes cho Quản lý tài chính (Base path: /financial)
  {
    path: PaymentRouteConfig.FINANCIAL_MANAGER.INDEX,
    element: <Outlet />,
    children: financialManagerRoutes,
  },
];

export default paymentRoutes;
