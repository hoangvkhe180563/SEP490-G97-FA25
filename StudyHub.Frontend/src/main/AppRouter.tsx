import classRoutes from "@/classManagement/routes/ClassRoutes";
import documentRoutes from "@/documentManagement/routes/DocumentRoutes";
import forumRoutes from "@/forumManagement/routes/ForumRoutes";
import RouteConfig from "@/common/constants/RouteConfig";
import uiManagementRoutes from "@/uiManagement/routes/UiManagementRoutes";
import userRoutes from "@/user/routes/UserRoutes";
import { Outlet, useLocation, useNavigate, useRoutes } from "react-router-dom";
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

const AppRouter = () => {
  const { user, checkAuth, isAuthenticated, isCheckingAuth } = useAuthStore();
  const { startPresence, stopPresence } = useUserOnlineStore();
  const { startPaymentConnection, stopPaymentConnection } = usePaymentStore();
  const { startRead, stopRead } = useConversationStore();
  const { startChat, stopChat } = useMessageStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isCheckingAuth) return;
    if (!isAuthenticated && !location.pathname.includes("/auth")) {
      navigate("/");
    }
  }, [isAuthenticated, isCheckingAuth, location.pathname, navigate]);

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
      element: user ? <RegisteredLayout user={user} /> : <GuestLayout />,
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
      element: <RegisteredLayout user={user} />,
      children: userRoutes,
    },
    {
      path: RouteConfig.UI_MANAGEMENT,
      element: <RegisteredLayout user={user} />,
      children: uiManagementRoutes,
    },
    {
      path: RouteConfig.CLASS_MANAGEMENT,
      element: <RegisteredLayout user={user} />,
      children: classRoutes,
    },
    {
      path: RouteConfig.DOCUMENT_MANAGEMENT,
      element: <RegisteredLayout user={user} />,
      children: documentRoutes,
    },
    {
      path: RouteConfig.COURSE_MANAGEMENT,
      element: <RegisteredLayout user={user} />,
      children: courseRoutes,
    },
    {
      path: RouteConfig.PAYMENT_MANAGEMENT,
      element: <RegisteredLayout user={user} />,
      children: paymentRoutes,
    },
    {
      path: RouteConfig.FORUM_MANAGEMENT,
      element: <RegisteredLayout user={user} />,
      children: forumRoutes,
    },
    {
      path: RouteConfig.QA_MANAGEMENT,
      element: <RegisteredLayout user={user} />,
      children: qaRoutes,
    },
    {
      path: RouteConfig.EXAM,
      element: <RegisteredLayout user={user} />,
      children: examRoutes,
    },
    {
      path: RouteConfig.RECOMMENDATION,
      element: <RegisteredLayout user={user} />,
      children: recommendationRoutes,
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ];

  const routesElement = useRoutes(appRoutes);
  return routesElement;
};

export default AppRouter;
