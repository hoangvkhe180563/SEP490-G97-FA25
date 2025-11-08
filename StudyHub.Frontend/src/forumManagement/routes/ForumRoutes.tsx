// src/forumManagement/routes/ForumRoutes.tsx
import ForumRouteConfig from "@/forumManagement/constants/ForumRouteConfig";
import ForumMain from "@/forumManagement/pages/forummain";
import PostDetail from "@/forumManagement/pages/postdetail";
import { Outlet, type RouteObject } from "react-router-dom";
import AppealManagement from "../pages/AppealManagement";
import PostManagement from "../pages/PostManagement";
import ViolationAccounts from "../pages/ViolationAccounts";
import CommentManagement from "../pages/CommentManagement";
import FlairManagement from "../pages/FlairManagement";
import ReportManagement from "../pages/ReportManagement";
import ViolationRecords from "../pages/ViolationRecords";

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
    path: ForumRouteConfig.MANAGER.COMMENT_MANAGEMENT,
    element: <CommentManagement />,
  },
  {
    path: ForumRouteConfig.MANAGER.FLAIR_MANAGEMENT,
    element: <FlairManagement />,
  },
  {
    path: ForumRouteConfig.MANAGER.REPORT_MANAGEMENT,
    element: <ReportManagement />,
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
    element: <Outlet />,
    children: managerRoutes,
  },
  {
    path: ForumRouteConfig.TEACHER.INDEX,
    children: teacherRoutes,
  },
  {
    path: ForumRouteConfig.STUDENT.INDEX,
    element: <Outlet />,
    children: studentRoutes,
  },
];

export default forumRoutes;
