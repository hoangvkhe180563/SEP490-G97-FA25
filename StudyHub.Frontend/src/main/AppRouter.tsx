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
  schoolManagerSidebarItems,
  teacherSidebarItems,
  uiManagerSidebarItems,
} from "@/common/constants/SidebarItems";
import authRoutes from "@/auth/routes/AuthRoutes";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import { useEffect } from "react";

const AppRouter = () => {
  const { isAuthenticated: isLoggedIn, checkAuth } = useAuthStore();

  useEffect(() => {
    // On app load, check if user is authenticated and populate appUser store
    (async () => {
      try {
        await checkAuth();
        // if authenticated, ensure the app user details are loaded into useAppUserStore
        const authUser = useAuthStore.getState().user;
        if (authUser && authUser.id) {
          // call getAppUserById from the app-user store to populate appUser
          try {
            await useAppUserStore
              .getState()
              .getAppUserById(String(authUser.id));
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [checkAuth]);

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
      element: (
        <MainLayout
          isLoggedIn={isLoggedIn}
          sidebarItems={schoolManagerSidebarItems}
        />
      ),
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
    {
      path: RouteConfig.FORUM_MANAGEMENT,
      element: <Outlet />,
      children: forumRoutes,
    },
  ];

  const routesElement = useRoutes(appRoutes);
  return routesElement;
};

export default AppRouter;
