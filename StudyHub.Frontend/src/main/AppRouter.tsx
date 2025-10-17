import classRoutes from "@/classManagement/routes/ClassRoutes";
import documentRoutes from "@/documentManagement/routes/DocumentRoutes";

import RouteConfig from "@/common/constants/RouteConfig";
import uiManagementRoutes from "@/uiManagement/routes/UiManagementRoutes";
import userRoutes from "@/user/routes/UserRoutes";
import { Outlet, useRoutes } from "react-router-dom";
import MainLayout from "@/common/pages/MainLayout";
import Homepage from "@/uiManagement/pages/Homepage";
import { guestSidebarItems, uiManagerSidebarItems } from "@/common/constants/SidebarItems";
import useLocalStorage from "@/common/hooks/useLocalStorage";

const AppRouter = () => {
  const [isLoggedIn] = useLocalStorage("isLoggedIn", false);

  const appRoutes = [
    {
      path: "/",
      element: <MainLayout isLoggedIn={isLoggedIn} sidebarItems={guestSidebarItems} />,
      children: [
        {
          index: true,
          element: <Homepage />
        }
      ]
    },
    {
      path: RouteConfig.USER,
      element: <Outlet />,
      children: userRoutes
    },
    {
      path: RouteConfig.UI_MANAGEMENT,
      element: <MainLayout isLoggedIn={isLoggedIn} sidebarItems={uiManagerSidebarItems} />,
      children: uiManagementRoutes
    },
    {
      path: RouteConfig.CLASS_MANAGEMENT,
      element: <Outlet />,
      children: classRoutes
    },
    {
      path: RouteConfig.DOCUMENT_MANAGEMENT,
      element: <Outlet />,
      children: documentRoutes
    }
  ];

  const routesElement = useRoutes(appRoutes);
  return routesElement;
}

export default AppRouter;