import NotificationRouteConfig from "../constants/NotificationRouteConfig";
import ListNotifications from "../pages/ListNotifications";

const notificationRoutes = [
  {
    path: NotificationRouteConfig.LIST,
    element: <ListNotifications />,
  },
];

export default notificationRoutes;