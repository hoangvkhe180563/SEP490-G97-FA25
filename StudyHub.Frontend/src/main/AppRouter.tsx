import classRoutes from "@/classManagement/routes/ClassRoutes";
import documentRoutes from "@/documentManagement/routes/DocumentRoutes";
import forumRoutes from "@/forumManagement/routes/ForumRoutes";
import RouteConfig from "@/common/constants/RouteConfig";
import uiManagementRoutes from "@/uiManagement/routes/UiManagementRoutes";
import userRoutes from "@/user/routes/UserRoutes";
import { Outlet, useRoutes } from "react-router-dom";
import courseRoutes from "@/courseManagement/routes/CourseRoute";
import MainLayout from "@/common/pages/MainLayout";
import Homepage from "@/uiManagement/pages/Homepage";
import {
  guestSidebarItems,
  uiManagerSidebarItems,
} from "@/common/constants/SidebarItems";
import authRoutes from "@/auth/routes/AuthRoutes";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import { useEffect } from "react";
import { useEnrollmentStore } from "@/courseManagement/stores/useEnrollmentStore";

const AppRouter = () => {
  const { isAuthenticated: isLoggedIn, checkAuth } = useAuthStore();
  // subscribe to auth user so we can populate the app-user store when login happens
  const authUser = useAuthStore((s) => s.user);

  useEffect(() => {
    (async () => {
      try {
        await checkAuth();
      } catch {
        // ignore
      }
    })();
  }, [checkAuth]);

  useEffect(() => {
    if (!authUser || !authUser.id) return;
    (async () => {
      try {
        await useAppUserStore.getState().getAppUserById(String(authUser.id));
      } catch {
        // ignore
      }
    })();
  }, [authUser]);

  // ensure enrollments for the logged-in user are loaded once on auth
  useEffect(() => {
    if (!authUser || !authUser.id) return;
    (async () => {
      try {
        // call the store's fetchByUser to populate enrollments globally
        await useEnrollmentStore.getState().fetchByUser(String(authUser.id));
      } catch {
        // ignore
      }
    })();
  }, [authUser]);

  const appRoutes = [
    {
      path: "/",
      element: (
        <MainLayout isLoggedIn={isLoggedIn} sidebarItems={guestSidebarItems} />
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
      element: <Outlet />,
      children: userRoutes,
    },
    {
      path: RouteConfig.UI_MANAGEMENT,
      element: (
        <MainLayout
          isLoggedIn={isLoggedIn}
          sidebarItems={uiManagerSidebarItems}
        />
      ),
      children: uiManagementRoutes,
    },
    {
      path: RouteConfig.CLASS_MANAGEMENT,
      element: <Outlet />,
      children: classRoutes,
    },
    {
      path: RouteConfig.DOCUMENT_MANAGEMENT,
      element: <Outlet />,
      children: documentRoutes,
    },
    {
      path: RouteConfig.COURSE_MANAGEMENT,
      element: <Outlet />,
      children: courseRoutes,
    },
    // {
    //   path: RouteConfig.FORUM_MANAGEMENT,
    //   element: <Outlet />,
    //   children: forumRoutes,
    // },
  ];

  const routesElement = useRoutes(appRoutes);
  return routesElement;
};

export default AppRouter;
