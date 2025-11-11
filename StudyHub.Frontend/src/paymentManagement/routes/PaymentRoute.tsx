import { Outlet, type RouteObject } from "react-router-dom";
import CourseRouteConfig from "../constants/PaymentRouteConfig";
import TransactionList from "../pages/manager/TransactionList";
import RevenueReport from "../pages/manager/RevenueReport";
import PaymentCheckout from "../pages/student/PaymentCheckout";
import WalletTopUp from "../pages/student/WalletTopUp";
import WithdrawRequest from "../pages/student/WithdrawRequest";
import PaymentSuccess from "../pages/student/PaymentSuccess";
import PaymentFailed from "../pages/student/PaymentFailed";
import TransactionHistory from "../pages/student/TransactionHistory";

const financialManagerRoutes: RouteObject[] = [
  {
    index: true,
    element: <div>Dashboard</div>,
  },
  {
    path: CourseRouteConfig.FINANCIAL_MANAGER.TRANSACTION,
    element: <TransactionList />,
  },
  {
    path: CourseRouteConfig.FINANCIAL_MANAGER.REVENUE,
    element: <RevenueReport />,
  },
];

// --- STUDENT ROUTES (Đường dẫn con cho /) ---
const studentCourseRoutes: RouteObject[] = [
  // Lưu ý: Không có 'index' element ở đây vì 'index' route thường là trang Home/Dashboard (nếu không được định nghĩa rõ ràng)
  // Trong mẫu của bạn, routes học sinh bắt đầu bằng /courses

  {
    // path="payments/checkout" element={<PaymentCheckout />}
    path: CourseRouteConfig.STUDENT.PAYMENT_CHECKOUT,
    element: <PaymentCheckout />,
  },
  {
    // wallet top-up
    path: CourseRouteConfig.STUDENT.WALLET_TOPUP,
    element: <WalletTopUp />,
  },
  {
    // wallet withdrawal
    path: CourseRouteConfig.STUDENT.WALLET_WITHDRAWAL,
    element: <WithdrawRequest />,
  },
  {
    // path="payment-success" element={<PaymentSuccess />}
    path: CourseRouteConfig.STUDENT.PAYMENT_SUCCESS,
    element: <PaymentSuccess />,
  },
  {
    // payment failed page
    path: CourseRouteConfig.STUDENT.PAYMENT_FAILED,
    element: <PaymentFailed />,
  },
  {
    // student transaction history
    path: CourseRouteConfig.STUDENT.TRANSACTION_HISTORY,
    element: <TransactionHistory />,
  },
];

// --- ROOT ROUTES ---
const paymentRoutes: RouteObject[] = [
  // Cấu hình routes cho Học sinh (Base path: /)
  {
    path: CourseRouteConfig.STUDENT.INDEX,
    element: <Outlet />,
    children: studentCourseRoutes,
  },
  // Cấu hình routes cho Quản lý tài chính (Base path: /financial)
  {
    path: CourseRouteConfig.FINANCIAL_MANAGER.INDEX,
    element: <Outlet />,
    children: financialManagerRoutes,
  },
];

export default paymentRoutes;
