import classRoutes from "@/classManagement/routes/ClassRoutes";
import documentRoutes from "@/documentManagement/routes/DocumentRoutes";

import RouteConfig from "@/common/constants/RouteConfig";
import Homepage from "@/uiManagement/pages/Homepage";
import uiManagementRoutes from "@/uiManagement/routes/UiManagementRoutes";
import userRoutes from "@/user/routes/UserRoutes";
import { Outlet, useRoutes } from "react-router-dom";
import courseRoutes from "@/courseManagement/routes/CourseRoute";

const AppRouter = () => {
  const appRoutes = [
    {
      path: "/",
      element: <Homepage />,
    },
    {
      path: "/:school",
      element: <Homepage />,
    },
    {
      path: RouteConfig.USER,
      element: <Outlet />,
      children: userRoutes,
    },
    {
      path: RouteConfig.UI_MANAGEMENT,
      element: <Outlet />,
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
  ];

  const routesElement = useRoutes(appRoutes);
  return routesElement;
};

export default AppRouter;
