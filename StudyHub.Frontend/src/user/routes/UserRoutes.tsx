import UserRouteConfig from "../constants/UserRouteConfig";
import TeacherLayout from "@/user/components/layouts/TeacherLayout";
import TeacherProfile from "../pages/teacher/TeacherProfile";
import ManagerLayout from "../components/layouts/ManagerLayout";
import StudentLayout from "../components/layouts/StudentLayout";
import ParentLayout from "../components/layouts/ParentLayout";
import StudentProfile from "../pages/student/StudentProfile";
import ParentProfile from "../pages/parent/ParentProfile";
import type { RouteObject } from "react-router-dom";
import CreateAccount from "../pages/manager/CreateAccount";
import AccountList from "../pages/manager/AccountList";

const teacherRoutes = [
  {
    index: true,
    element: <div>Dashboard</div>,
  },
  {
    path: UserRouteConfig.TEACHER.PROFILE,
    element: <TeacherProfile />,
  },
];

const managerRoutes = [
  {
    index: true,
    element: <div>Dashboard</div>,
  },
  {
    path: UserRouteConfig.MANAGER.ACCOUNT_LIST,
    element: <AccountList />,
  },
  {
    path: UserRouteConfig.MANAGER.ADD_ACCOUNT,
    element: <CreateAccount />,
  },
];

const studentRoutes = [
  {
    path: UserRouteConfig.STUDENT.PROFILE,
    element: <StudentProfile />,
  },
];

const parentRoutes = [
  {
    path: UserRouteConfig.PARENT.PROFILE,
    element: <ParentProfile />,
  },
];

const userRoutes: RouteObject[] = [
  {
    path: UserRouteConfig.TEACHER.INDEX,
    element: <TeacherLayout />,
    children: teacherRoutes,
  },
  {
    path: UserRouteConfig.MANAGER.INDEX,
    element: <ManagerLayout />,
    children: managerRoutes,
  },
  {
    path: UserRouteConfig.STUDENT.INDEX,
    element: <StudentLayout />,
    children: studentRoutes,
  },
  {
    path: UserRouteConfig.PARENT.INDEX,
    element: <ParentLayout />,
    children: parentRoutes,
  },
];

export default userRoutes;
