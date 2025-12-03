// src/forumManagement/routes/ForumRoutes.tsx
import ForumRouteConfig from "@/forumManagement/constants/ForumRouteConfig";

import { Outlet, type RouteObject } from "react-router-dom";
import RequireRole from "@/common/components/RequireRole";
import AppealManagement from "../pages/AppealManagement";
import PostManagement from "../pages/PostManagement";
import ViolationAccounts from "../pages/ViolationAccounts";
import FlairManagement from "../pages/FlairManagement";
import ViolationRecords from "../pages/ViolationRecords";
import { ForumLayout } from "../components/ForumLayout";
import ForumRuleManagement from "../pages/ForumRuleManagement";
import ModeratorDashboard from "../pages/ModeratorDashboard";
import ForumMain from "../pages/forummain";
import PostDetail from "../pages/postdetail";
import { ROLES } from "@/common/constants/Roles";

const managerRoutes = [
  {
    path: ForumRouteConfig.MANAGER.DASHBOARD,
    element: <ModeratorDashboard />,
  },
  {
    path: ForumRouteConfig.MANAGER.FORUMS,
    element: <ForumMain />,
  },
  {
    path: ForumRouteConfig.MANAGER.POST_DETAIL,
    element: <PostDetail />,
  },
  {
    path: ForumRouteConfig.MANAGER.APPEAL_MANAGEMENT,
    element: <AppealManagement />,
  },
  {
    path: ForumRouteConfig.MANAGER.POST_MANAGEMENT,
    element: <PostManagement />,
  },
  {
    path: ForumRouteConfig.MANAGER.FLAIR_MANAGEMENT,
    element: <FlairManagement />,
  },
  {
    path: ForumRouteConfig.MANAGER.VIOLATION_RECORDS,
    element: <ViolationRecords />,
  },
  {
    path: ForumRouteConfig.MANAGER.VIOLATION_ACCOUNTS,
    element: <ViolationAccounts />,
  },
  {
    path: ForumRouteConfig.MANAGER.RULE_MANAGEMENT,
    element: <ForumRuleManagement />,
  },
];

const teacherRoutes = [
  {
    path: ForumRouteConfig.USER.FORUMS,
    element: <ForumMain />,
  },
  {
    path: ForumRouteConfig.USER.POST_DETAIL,
    element: <PostDetail />,
  },
];

const forumRoutes: RouteObject[] = [
  {
    path: ForumRouteConfig.MANAGER.INDEX,
    element: (
      <RequireRole allowedRoles={[ROLES.MODERATOR]}>
        <ForumLayout>
          <Outlet />
        </ForumLayout>
      </RequireRole>
    ),
    children: managerRoutes,
  },
  {
    path: ForumRouteConfig.USER.INDEX,
    element: (
      <RequireRole
        allowedRoles={[
          ROLES.SUBJECT_TEACHER,
          ROLES.HOMEROOM_TEACHER,
          ROLES.HEAD_TEACHER,
          ROLES.QNA_TEACHER,
          ROLES.SCHOOL_STUDENT,
        ]}
      >
        <ForumLayout>
          <Outlet />
        </ForumLayout>
      </RequireRole>
    ),
    children: teacherRoutes,
  },
];

export default forumRoutes;
