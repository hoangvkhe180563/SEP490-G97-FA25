import type { RouteObject } from "react-router-dom";
import UiManagementRouteConfig from "../constants/UiManagementRouteConfig";
import LandingPageEdit from "../pages/LandingPageEdit";
import Homepage from "../pages/Homepage";
import SchoolHomepage from "../pages/SchoolHomepage";
import LandingPageList from "../pages/LandingPageList";

const uiManagementRoutes: RouteObject[] = [
  {
    path: UiManagementRouteConfig.LANDING_PAGE.INDEX,
    element: <Homepage />
  },
  {
    path: UiManagementRouteConfig.LANDING_PAGE.SCHOOL,
    element: <SchoolHomepage />
  },
  {
    path: UiManagementRouteConfig.LANDING_PAGE.EDIT,
    element: <LandingPageEdit />
  },
  {
    path: UiManagementRouteConfig.LANDING_PAGE.LIST,
    element: <LandingPageList />
  },
  {
    path: UiManagementRouteConfig.PAYMENT_PAGE.INDEX,
    // element: <PaymentPage />
  },
  {
    path: UiManagementRouteConfig.PAYMENT_PAGE.CONFIGURATION,
    // element: <PaymentPageEdit />
  },
];

export default uiManagementRoutes;