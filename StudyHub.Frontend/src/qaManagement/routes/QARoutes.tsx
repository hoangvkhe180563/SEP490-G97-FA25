import { Outlet, type RouteObject } from "react-router-dom";
import QARouteConfig from "../constants/QARouteConfig";
import ConversationList from "../pages/student/ConversationList";
import ConversationDetails from "../pages/student/ConversationDetails";
import TeacherConversationList from "../pages/teacher/ConversationList";
import TeacherConversationDetails from "../pages/teacher/ConversationDetails";
import ManagerDashboard from "../pages/manager/Dashboard";
import TopicList from "../pages/manager/TopicList";
import RequireRole from "@/common/components/RequireRole";
import { ROLES } from "@/common/constants/Roles";

const teacherRoutes: RouteObject[] = [
  {
    path: QARouteConfig.TEACHER.CONVERSATIONS,
    element: <TeacherConversationList />,
  },
  {
    path: QARouteConfig.TEACHER.DETAILS,
    element: <TeacherConversationDetails />,
  },
];

const studentRoutes: RouteObject[] = [
  {
    path: QARouteConfig.STUDENT.CONVERSATIONS,
    element: <ConversationList />,
  },
  {
    path: QARouteConfig.STUDENT.DETAILS,
    element: <ConversationDetails />,
  },
];

const managerRoutes: RouteObject[] = [
  {
    index: true,
    element: <ManagerDashboard />,
  },
  {
    path: QARouteConfig.MANAGER.TOPICS,
    element: <TopicList />,
  },
];

const qaRoutes = [
  {
    path: QARouteConfig.TEACHER.INDEX,
    element: (
      <RequireRole allowedRoles={[ROLES.QNA_TEACHER]}>
        <Outlet />
      </RequireRole>
    ),
    children: teacherRoutes,
  },
  {
    path: QARouteConfig.STUDENT.INDEX,
    element: (
      <RequireRole
        allowedRoles={[ROLES.SCHOOL_STUDENT, ROLES.EXTERNAL_STUDENT]}
      >
        <Outlet />
      </RequireRole>
    ),
    children: studentRoutes,
  },
  {
    path: QARouteConfig.MANAGER.INDEX,
    element: (
      <RequireRole allowedRoles={[ROLES.SCHOOL_ADMIN]}>
        <Outlet />
      </RequireRole>
    ),
    children: managerRoutes,
  },
];
export default qaRoutes;
