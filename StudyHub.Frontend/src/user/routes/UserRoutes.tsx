import UserRouteConfig from "../constants/UserRouteConfig";
import type { RouteObject } from "react-router-dom";
import CreateAccount from "../pages/manager/CreateAccount";
import CreateAccountAdmin from "../pages/admin/CreateAccount";
import AccountList from "../pages/manager/AccountList";
import AccountListAdmin from "../pages/admin/AccountList";
import UpdateAccount from "../pages/manager/UpdateAccount";
import UpdateAccountAdmin from "../pages/admin/UpdateAccount";
import ManagerLayout from "../components/layouts/ManagerLayout";
import UpdateProfile from "../pages/UpdateProfile";
import AccountRecoveryList from "../pages/manager/AccountRecoveryList";
import AccountRecoveryListAdmin from "../pages/admin/AccountRecoveryList";
import AccountDashboard from "../pages/manager/AccountDashboard";
import AccountDashboardAdmin from "../pages/admin/AccountDashboard";
import RequireRole from "@/common/components/RequireRole";
import { ROLES } from "@/common/constants/Roles";

const adminRoutes = [
  {
    index: true,
    element: (
      <RequireRole allowedRoles={[ROLES.ADMIN]}>
        <AccountDashboardAdmin />
      </RequireRole>
    ),
  },
  {
    path: UserRouteConfig.ADMIN.ACCOUNT_LIST,
    element: (
      <RequireRole allowedRoles={[ROLES.ADMIN]}>
        <AccountListAdmin />
      </RequireRole>
    ),
  },
  {
    path: UserRouteConfig.ADMIN.ADD_ACCOUNT,
    element: (
      <RequireRole allowedRoles={[ROLES.ADMIN]}>
        <CreateAccountAdmin />
      </RequireRole>
    ),
  },
  {
    path: UserRouteConfig.ADMIN.UPDATE_ACCOUNT,
    element: (
      <RequireRole allowedRoles={[ROLES.ADMIN]}>
        <UpdateAccountAdmin />
      </RequireRole>
    ),
  },
  {
    path: UserRouteConfig.MANAGER.ACCOUNT_RECOVERY_LIST,
    element: (
      <RequireRole allowedRoles={[ROLES.ADMIN]}>
        <AccountRecoveryListAdmin />
      </RequireRole>
    ),
  },
];

const managerRoutes = [
  {
    index: true,
    element: (
      <RequireRole allowedRoles={[ROLES.SCHOOL_ADMIN]}>
        <AccountDashboard />
      </RequireRole>
    ),
  },
  {
    path: UserRouteConfig.MANAGER.ACCOUNT_LIST,
    element: (
      <RequireRole allowedRoles={[ROLES.SCHOOL_ADMIN]}>
        <AccountList />
      </RequireRole>
    ),
  },
  {
    path: UserRouteConfig.MANAGER.ADD_ACCOUNT,
    element: (
      <RequireRole allowedRoles={[ROLES.SCHOOL_ADMIN]}>
        <CreateAccount />
      </RequireRole>
    ),
  },
  {
    path: UserRouteConfig.MANAGER.UPDATE_ACCOUNT,
    element: (
      <RequireRole allowedRoles={[ROLES.SCHOOL_ADMIN]}>
        <UpdateAccount />
      </RequireRole>
    ),
  },
  {
    path: UserRouteConfig.MANAGER.ACCOUNT_RECOVERY_LIST,
    element: (
      <RequireRole allowedRoles={[ROLES.SCHOOL_ADMIN]}>
        <AccountRecoveryList />
      </RequireRole>
    ),
  },
];

const userRoutes: RouteObject[] = [
  {
    path: UserRouteConfig.MANAGER.INDEX,
    element: <ManagerLayout />,
    children: managerRoutes,
  },
  {
    path: UserRouteConfig.ADMIN.INDEX,
    element: <ManagerLayout />,
    children: adminRoutes,
  },
  {
    path: UserRouteConfig.USER.UPDATE_PROFILE,
    element: <UpdateProfile />,
  },
];

export default userRoutes;
