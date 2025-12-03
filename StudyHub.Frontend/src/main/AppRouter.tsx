import classRoutes from "@/classManagement/routes/ClassRoutes";
import documentRoutes from "@/documentManagement/routes/DocumentRoutes";
import forumRoutes from "@/forumManagement/routes/ForumRoutes";
import RouteConfig from "@/common/constants/RouteConfig";
import uiManagementRoutes from "@/uiManagement/routes/UiManagementRoutes";
import userRoutes from "@/user/routes/UserRoutes";
import { Outlet, useRoutes } from "react-router-dom";
import courseRoutes from "@/courseManagement/routes/CourseRoute";
import Homepage from "@/uiManagement/pages/Homepage";
import authRoutes from "@/auth/routes/AuthRoutes";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { useEffect } from "react";
import GuestLayout from "@/common/pages/GuestLayout";
import RegisteredLayout from "@/common/pages/RegisteredLayout";
import paymentRoutes from "@/paymentManagement/routes/PaymentRoute";
import qaRoutes from "@/qaManagement/routes/QARoutes";
import examRoutes from "@/exam/routes/ExamRoutes";
import { useUserOnlineStore } from "@/common/stores/useUserOnlineStore";
import { usePaymentStore } from "@/paymentManagement/stores/usePaymentStore";
import { useConversationStore } from "@/qaManagement/stores/useConversationStore";
import { useMessageStore } from "@/qaManagement/stores/useMessageStore";
import NotFound from "@/common/pages/NotFound";
import recommendationRoutes from "@/recommend/routes/RecommendationRoutes";
import ProtectedRoute from "@/common/components/ProtectedRoute";

const AppRouter = () => {
  const { user, checkAuth, isAuthenticated, isCheckingAuth } = useAuthStore();
  const { startPresence, stopPresence } = useUserOnlineStore();
  const { startPaymentConnection, stopPaymentConnection } = usePaymentStore();
  const { startRead, stopRead } = useConversationStore();
  const { startChat, stopChat } = useMessageStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    (async () => {
      try {
        // read latest user after checkAuth completed
        if (!isAuthenticated) return;
        await startPresence?.();
        await startPaymentConnection();
        await startRead?.();
        await startChat?.();
      } catch (err) {
        // non-fatal
        console.warn("startPresence failed", err);
      }
    })();
    return () => {
      try {
        if (!isAuthenticated) return;
        stopPresence?.();
        stopPaymentConnection();
        stopRead?.();
        stopChat?.();
      } catch (err) {
        /* ignore */
      }
    };
    // eslint-disable-next-line
  }, [isAuthenticated]);

  const appRoutes = [
    {
      path: "/",
      element: user ? (
        <ProtectedRoute>
          <RegisteredLayout user={user} />
        </ProtectedRoute>
      ) : (
        <GuestLayout />
      ),
      children: [
        {
          index: true,
          element: <Homepage />,
        },
      ],
    },
    {
      path: RouteConfig.AUTH,
      element: <Outlet />,
      children: authRoutes,
    },
    {
      path: RouteConfig.USER,
      element: (
        <ProtectedRoute>
          <RegisteredLayout user={user} />,
        </ProtectedRoute>
      ),
      children: userRoutes,
    },
    {
      path: RouteConfig.UI_MANAGEMENT,
      element: (
        <ProtectedRoute>
          <RegisteredLayout user={user} />
        </ProtectedRoute>
      ),
      children: uiManagementRoutes,
    },
    {
      path: RouteConfig.CLASS_MANAGEMENT,
      element: (
        <ProtectedRoute>
          <RegisteredLayout user={user} />
        </ProtectedRoute>
      ),
      children: classRoutes,
    },
    {
      path: RouteConfig.DOCUMENT_MANAGEMENT,
      element: (
        <ProtectedRoute>
          <RegisteredLayout user={user} />
        </ProtectedRoute>
      ),
      children: documentRoutes,
    },
    {
      path: RouteConfig.COURSE_MANAGEMENT,
      element: (
        <ProtectedRoute>
          <RegisteredLayout user={user} />
        </ProtectedRoute>
      ),
      children: courseRoutes,
    },
    {
      path: RouteConfig.PAYMENT_MANAGEMENT,
      element: (
        <ProtectedRoute>
          <RegisteredLayout user={user} />
        </ProtectedRoute>
      ),
      children: paymentRoutes,
    },
    {
      path: RouteConfig.FORUM_MANAGEMENT,
      element: (
        <ProtectedRoute>
          <RegisteredLayout user={user} />
        </ProtectedRoute>
      ),
      children: forumRoutes,
    },
    {
      path: RouteConfig.QA_MANAGEMENT,
      element: (
        <ProtectedRoute>
          <RegisteredLayout user={user} />
        </ProtectedRoute>
      ),
      children: qaRoutes,
    },
    {
      path: RouteConfig.EXAM,
      element: (
        <ProtectedRoute>
          <RegisteredLayout user={user} />
        </ProtectedRoute>
      ),
      children: examRoutes,
    },
    {
      path: RouteConfig.RECOMMENDATION,
      element: (
        <ProtectedRoute>
          <RegisteredLayout user={user} />
        </ProtectedRoute>
      ),
      children: recommendationRoutes,
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ];

  const routesElement = useRoutes(appRoutes);

  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-black/60">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-sky-500" />
          <p className="text-lg text-slate-700 dark:text-slate-200">
            Đang kiểm tra xác thực...
          </p>
        </div>
      </div>
    );
  }
  return routesElement;
};

export default AppRouter;
