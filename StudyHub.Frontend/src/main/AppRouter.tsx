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

const AppRouter = () => {
  const { user, checkAuth } = useAuthStore();
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        await checkAuth();
      } catch {
        console.log("lỗi authorization");
      } finally {
        setAuthChecked(true);
      }
    })();
  }, [checkAuth]);

  useEffect(() => {
    if (authChecked && !user && !location.pathname.includes("/auth")) {
      navigate("/");
    }
  }, [authChecked])

  const appRoutes = [
    {
      path: "/",
      element: (
        user ? <RegisteredLayout user={user} /> : <GuestLayout />
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
      path: RouteConfig.FORUM_MANAGEMENT,
      element: <RegisteredLayout user={user} />,
      children: forumRoutes,
    },
  ];

  const routesElement = useRoutes(appRoutes);
  return routesElement;
};

export default AppRouter;
