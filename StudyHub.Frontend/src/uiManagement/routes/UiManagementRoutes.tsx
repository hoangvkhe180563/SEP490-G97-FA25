import type { RouteObject } from "react-router-dom";
import UiManagementRouteConfig from "../constants/UiManagementRouteConfig";

const uiManagementRoutes: RouteObject[] = [
  {
    path: UiManagementRouteConfig.LANDING_PAGE.CONFIGURATION,
    // element: <LandingPageEdit/>
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