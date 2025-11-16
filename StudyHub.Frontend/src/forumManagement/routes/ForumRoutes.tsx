// src/forumManagement/routes/ForumRoutes.tsx
import ForumRouteConfig from "@/forumManagement/constants/ForumRouteConfig";
import ForumMain from "@/forumManagement/pages/ForumMain";
import PostDetail from "@/forumManagement/pages/PostDetail";
import { Outlet, type RouteObject } from "react-router-dom";
import AppealManagement from "../pages/AppealManagement";
import PostManagement from "../pages/PostManagement";
import ViolationAccounts from "../pages/ViolationAccounts";
import FlairManagement from "../pages/FlairManagement";
import ViolationRecords from "../pages/ViolationRecords";
import { ForumLayout } from "../components/ForumLayout";

const managerRoutes = [
  {
    index: true,
    element: <div>Manager Dashboard</div>,
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
      <ForumLayout>
        <Outlet />
      </ForumLayout>
    ),
    children: managerRoutes,
  },
  {
    path: ForumRouteConfig.TEACHER.INDEX,
    element: (
      <ForumLayout>
        <Outlet />
      </ForumLayout>
    ),
    children: teacherRoutes,
  },
  {
    path: ForumRouteConfig.STUDENT.INDEX,
    element: (
      <ForumLayout>
        <Outlet />
      </ForumLayout>
    ),
    children: studentRoutes,
  },
];

export default forumRoutes;
