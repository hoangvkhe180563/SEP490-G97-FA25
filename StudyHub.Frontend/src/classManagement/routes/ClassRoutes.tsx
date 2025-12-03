import ClassList from "@/classManagement/pages/ClassList";
import DetailedClassTeacher from "@/classManagement/pages/teacher/DetailedClassTeacher";
import ClassRouteConfig from "@/classManagement/constants/ClassRouteConfig";
import { Outlet, type RouteObject } from "react-router-dom";
import RequireRole from "@/common/components/RequireRole";

import AddEditClassworkForm from "../pages/teacher/EditClasswork";
import ClassworkDetail from "../pages/student/ClassworkDetail";

import ConfirmInvite from "../pages/ConfirmInvite";
import ClassRedirect from "../components/redirect/ClassRedirect";
import ClassworkSubmissionsPage from "../pages/teacher/ClassSubmission";
import ClassDocumentsPage from "@/classManagement/pages/ClassDocument";

import AddClasswork from "../pages/teacher/AddClasswork";
import EditClassworkForm from "../pages/teacher/EditClasswork";
import DashboardPage from "../pages/manager/ClassManagement";
import { m } from "framer-motion";

import { ROLES } from "@/common/constants/Roles";


const teacherClassRoutes = [
  {
    index: true,
    element: <ClassList />,
  },
  {
    path: ClassRouteConfig.TEACHER.CLASS_DETAIL,
    element: <DetailedClassTeacher />,
  },
  {
    path: ClassRouteConfig.TEACHER.ADD_CLASSWORK,
    element: <AddClasswork />,
  },
  {
    path: ClassRouteConfig.TEACHER.EDIT_CLASSWORK,
    element: <EditClassworkForm />,
  },
  {
    path: ClassRouteConfig.TEACHER.CLASSWORK_DETAIL,
    element: <ClassworkDetail />,
  },
  {
    path: ClassRouteConfig.TEACHER.CONFIRM_INVITE,
    element: <ConfirmInvite />,
  },
  {
    path: ClassRouteConfig.TEACHER.SUBMISSION_PAGE,
    element: <ClassworkSubmissionsPage />,
  },
  {
    path: ClassRouteConfig.TEACHER.CLASS_DOCUMENTS,
    element: <ClassDocumentsPage />,
  },
];

const studentClassRoutes = [
  {
    index: true,
    element: <ClassList />,
  },
  {
    path: ClassRouteConfig.STUDENT.CLASS_DETAIL,
    element: <DetailedClassTeacher />,
  },
  {
    path: ClassRouteConfig.STUDENT.CLASSWORK_DETAIL,
    element: <ClassworkDetail />,
  },
  {
    path: ClassRouteConfig.TEACHER.CONFIRM_INVITE,
    element: <ConfirmInvite />,
  },
  {
    path: ClassRouteConfig.TEACHER.CLASS_DOCUMENTS,
    element: <ClassDocumentsPage />,
  },
];
const managerClassRoutes = [

  {
    path: ClassRouteConfig.MANAGER.CLASS_MANAGEMENT,
    element: <DashboardPage />,
  }
];
const classRoutes: RouteObject[] = [
  {
    path: ClassRouteConfig.TEACHER.INDEX,
    element: (
      <RequireRole
        allowedRoles={[ROLES.SUBJECT_TEACHER, ROLES.HOMEROOM_TEACHER]}
      >
        <Outlet />
      </RequireRole>
    ),
    children: teacherClassRoutes,
  },
  {
    path: ClassRouteConfig.STUDENT.INDEX,
    element: (
      <RequireRole allowedRoles={[ROLES.SCHOOL_STUDENT]}>
        <Outlet />
      </RequireRole>
    ),
    children: studentClassRoutes,
  },
   {
    path: ClassRouteConfig.MANAGER.INDEX,
    element: (
      <RequireRole allowedRoles={["School Admin"]}>
        <Outlet />
      </RequireRole>
    ),
    children: managerClassRoutes,
  },
  {
    path: "",
    element: <ClassRedirect />,
  },
];

export default classRoutes;
