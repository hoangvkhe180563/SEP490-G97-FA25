import type { RouteObject } from "react-router-dom";
import UiManagementRouteConfig from "../constants/UiManagementRouteConfig";
import LandingPageEdit from "../pages/LandingPageEdit";
import Homepage from "../pages/Homepage";
import SchoolHomepage from "../pages/SchoolHomepage";
import RequireRole from "@/common/components/RequireRole";
import { ROLES } from "@/common/constants/Roles";

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
      <RequireRole allowedRoles={[ROLES.SCHOOL_ADMIN, ROLES.UI_MANAGER]}>
        <LandingPageEdit />
      </RequireRole>
    ),
  },
];

export default uiManagementRoutes;
