import type { RouteObject } from "react-router-dom";
import UiManagementRouteConfig from "../constants/UiManagementRouteConfig";
import LandingPageEdit from "../pages/LandingPageEdit";
import Homepage from "../pages/Homepage";
import SchoolHomepage from "../pages/SchoolHomepage";
import RequireRole from "@/common/components/RequireRole";

const uiManagementRoutes: RouteObject[] = [
  {
    path: UiManagementRouteConfig.LANDING_PAGE.INDEX,
    element: <Homepage />,
  },
  {
    path: UiManagementRouteConfig.LANDING_PAGE.SCHOOL,
    element: <SchoolHomepage />,
  },
  {
    path: UiManagementRouteConfig.LANDING_PAGE.EDIT,
    element: (
      <RequireRole allowedRoles={["School Admin", "UI Manager"]}>
        <LandingPageEdit />
      </RequireRole>
    ),
  },
];

export default uiManagementRoutes;
