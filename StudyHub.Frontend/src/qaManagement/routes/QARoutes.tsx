import { Outlet, type RouteObject } from "react-router-dom";
import QARouteConfig from "../constants/QARouteConfig";
import ConversationList from "../pages/student/ConversationList";
import ConversationDetails from "../pages/student/ConversationDetails";
import TeacherConversationList from "../pages/teacher/ConversationList";
import TeacherConversationDetails from "../pages/teacher/ConversationDetails";

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
];
export default qaRoutes;
