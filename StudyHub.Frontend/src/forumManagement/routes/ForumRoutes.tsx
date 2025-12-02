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
import ForumMain from "../pages/ForumMain";
import PostDetail from "../pages/PostDetail";

const managerRoutes = [
  {
    index: true,
    element: <div>Manager Dashboard</div>,
  },
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
    index: true,
    element: <div>Teacher Dashboard</div>,
  },
  {
    path: ForumRouteConfig.TEACHER.FORUMS,
    element: <ForumMain />,
  },
  {
    path: ForumRouteConfig.TEACHER.POST_DETAIL,
    element: <PostDetail />,
  },
];

const studentRoutes = [
  {
    index: true,
    element: <div>Student Dashboard</div>,
  },
  {
    path: ForumRouteConfig.STUDENT.FORUMS,
    element: <ForumMain />,
  },
  {
    path: ForumRouteConfig.STUDENT.POST_DETAIL,
    element: <PostDetail />,
  },
];

const forumRoutes: RouteObject[] = [
  {
    path: ForumRouteConfig.MANAGER.INDEX,
    element: (
      <RequireRole allowedRoles={["Moderator", "School Admin"]}>
        <ForumLayout>
          <Outlet />
        </ForumLayout>
      </RequireRole>
    ),
    children: managerRoutes,
  },
  {
    path: ForumRouteConfig.TEACHER.INDEX,
    element: (
      <RequireRole
        allowedRoles={[
          "Subject Teacher",
          "Head of Department Teacher",
          "Q&A Teacher",
          "Homeroom Teacher",
          "Moderator",
          "School Student",
        ]}
      >
        <ForumLayout>
          <Outlet />
        </ForumLayout>
      </RequireRole>
    ),
    children: teacherRoutes,
  },
  {
    path: ForumRouteConfig.STUDENT.INDEX,
    element: (
      <RequireRole allowedRoles={["School Student", "External Student"]}>
        <ForumLayout>
          <Outlet />
        </ForumLayout>
      </RequireRole>
    ),
    children: studentRoutes,
  },
];

export default forumRoutes;
