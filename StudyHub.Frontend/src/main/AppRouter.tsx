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
import { useEffect, useState } from "react";
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

const AppRouter = () => {
  const { user, checkAuth } = useAuthStore();
  const { startPresence, stopPresence } = useUserOnlineStore();
  const { startPaymentConnection, stopPaymentConnection } = usePaymentStore();
  const { startRead, stopRead } = useConversationStore();
  const { startChat, stopChat } = useMessageStore();
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  // on component mount, check auth and start authentication hubs
  useEffect(() => {
    (async () => {
      try {
        await checkAuth();
        try {
          // read latest user after checkAuth completed
          const currentUser = useAuthStore.getState().user;
          if (!currentUser) return;
          await startPresence();
          await startPaymentConnection();
          await startRead?.();
          await startChat?.();

          // stop presence when the tab/window unloads
          try {
            window.addEventListener("beforeunload", stopPresence as any);
            window.addEventListener("beforeunload", stopRead as any);
            window.addEventListener("beforeunload", stopChat as any);
            window.addEventListener("beforeunload", stopPresence as any);
            window.removeEventListener(
              "beforeunload",
              stopPaymentConnection as any
            );
          } catch (err) {
            console.warn("failed to add unload listener", err);
          }
        } catch (err) {
          // non-fatal
          console.warn("startPresence failed", err);
        }
      } catch {
        console.log("lỗi authorization");
      } finally {
        setAuthChecked(true);
      }
    })();
    return () => {
      try {
        // remove unload listener and stop presence
        try {
          window.removeEventListener("beforeunload", stopPresence as any);
          window.removeEventListener(
            "beforeunload",
            stopPaymentConnection as any
          );
          window.removeEventListener("beforeunload", stopRead as any);
          window.removeEventListener("beforeunload", stopChat as any);
        } catch (err) {
          console.warn("failed to remove unload listener", err);
        }
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;
        stopPresence();
        stopPaymentConnection();
        stopRead?.();
        stopChat?.();
      } catch (err) {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked]);

  useEffect(() => {
    if (authChecked && !user && !location.pathname.includes("/auth")) {
      navigate("/");
    }
  }, [authChecked, user, location.pathname, navigate]);

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
      path: "*",
      element: <NotFound />,
    },
  ];

  const routesElement = useRoutes(appRoutes);
  return routesElement;
};

export default AppRouter;
