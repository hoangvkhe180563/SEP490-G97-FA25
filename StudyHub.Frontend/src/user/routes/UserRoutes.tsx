import UserRouteConfig from "../constants/UserRouteConfig";
import type { RouteObject } from "react-router-dom";
import CreateAccount from "../pages/manager/CreateAccount";
import AccountList from "../pages/manager/AccountList";
import UpdateAccount from "../pages/manager/UpdateAccount";
import ManagerLayout from "../components/layouts/ManagerLayout";

const managerRoutes = [
  {
    index: true,
    element: <div>Dashboard</div>,
  },
  {
    path: UserRouteConfig.MANAGER.ACCOUNT_LIST,
    element: <AccountList />,
  },
  {
    path: UserRouteConfig.MANAGER.ADD_ACCOUNT,
    element: <CreateAccount />,
  },
  {
    path: UserRouteConfig.MANAGER.UPDATE_ACCOUNT,
    element: <UpdateAccount />,
  },
];

const userRoutes: RouteObject[] = [
  {
    path: UserRouteConfig.MANAGER.INDEX,
    element: <ManagerLayout />,
    children: managerRoutes,
  },
];

export default userRoutes;
