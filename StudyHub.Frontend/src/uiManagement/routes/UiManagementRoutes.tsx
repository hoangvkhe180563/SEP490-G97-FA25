import type { RouteObject } from "react-router-dom";
import UiManagementRouteConfig from "../constants/UiManagementRouteConfig";
import LandingPageEdit from "../pages/LandingPageEdit";
import Homepage from "../pages/Homepage";
import SchoolHomepage from "../pages/SchoolHomepage";
import RequireRole from "@/common/components/RequireRole";
import { ROLES } from "@/common/constants/Roles";
import ListSchools from "../pages/ListSchools";
import AddSchool from "../pages/AddSchool";
import EditSchool from "../pages/EditSchool";

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
  {
    path: UiManagementRouteConfig.SCHOOL.LIST,
    element: (
      <RequireRole allowedRoles={[ROLES.ADMIN]}>
        <ListSchools />
      </RequireRole>
    )
  },
  {
    path: UiManagementRouteConfig.SCHOOL.ADD,
    element: (
      <RequireRole allowedRoles={[ROLES.ADMIN]}>
        <AddSchool />
      </RequireRole>
    )
  },
  {
    path: UiManagementRouteConfig.SCHOOL.EDIT,
    element: (
      <RequireRole allowedRoles={[ROLES.ADMIN]}>
        <EditSchool />
      </RequireRole>
    )
  }
];

export default uiManagementRoutes;
