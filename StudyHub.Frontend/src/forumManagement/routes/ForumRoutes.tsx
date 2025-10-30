//src/forumManagement/routes/ForumRoutes.tsx
import ForumRouteConfig from "@/forumManagement/constants/ForumRouteConfig";
import ManagerLayout from "@/user/components/layouts/ManagerLayout";
import ForumMain from "@/forumManagement/pages/forummain";
import PostDetail from "@/forumManagement/pages/postdetail";

import type { RouteObject } from "react-router-dom";

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
    path: "forums/details/:postId",
    element: <PostDetail />,
  },
];

const forumRoutes: RouteObject[] = [
  {
    path: ForumRouteConfig.MANAGER.INDEX,
    element: <ManagerLayout />,
    children: managerRoutes,
  },
];

export default forumRoutes;
