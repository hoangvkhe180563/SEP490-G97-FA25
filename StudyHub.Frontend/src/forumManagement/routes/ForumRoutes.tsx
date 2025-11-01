// src/forumManagement/routes/ForumRoutes.tsx
import ForumRouteConfig from "@/forumManagement/constants/ForumRouteConfig";
import ForumMain from "@/forumManagement/pages/forummain";
import PostDetail from "@/forumManagement/pages/postdetail";
import { Outlet, type RouteObject } from "react-router-dom";

const managerRoutes = [
  {
    index: true,
    element: <div>Manager Dashboard</div>,
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
