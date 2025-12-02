import { Outlet, type RouteObject } from "react-router-dom";
import QARouteConfig from "../constants/QARouteConfig";
import ConversationList from "../pages/student/ConversationList";
import ConversationDetails from "../pages/student/ConversationDetails";
import TeacherConversationList from "../pages/teacher/ConversationList";
import TeacherConversationDetails from "../pages/teacher/ConversationDetails";
import ManagerDashboard from "../pages/manager/Dashboard";

const teacherRoutes: RouteObject[] = [
  { index: true, element: <div>Teacher Dashboard</div> },
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
    index: true,
    element: <div>Student Dashboard</div>,
  },
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
];

const qaRoutes = [
  {
    path: QARouteConfig.TEACHER.INDEX,
    element: <Outlet />,
    children: teacherRoutes,
  },
  {
    path: QARouteConfig.STUDENT.INDEX,
    element: <Outlet />,
    children: studentRoutes,
  },
  {
    path: QARouteConfig.MANAGER.INDEX,
    element: <Outlet />,
    children: managerRoutes,
  },
];
export default qaRoutes;
