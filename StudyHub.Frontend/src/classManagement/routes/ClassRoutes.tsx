import ClassList from "@/classManagement/pages/ClassList";
import DetailedClassTeacher from "@/classManagement/pages/teacher/DetailedClassTeacher";
import ClassRouteConfig from "@/classManagement/constants/ClassRouteConfig";
import { Outlet, type RouteObject } from "react-router-dom";
import { Edit } from "lucide-react";
import AddEditClassworkForm from "../pages/AddEditClasswork";
import ClassworkDetail from "../pages/ClassworkDetail";
import ConfirmInvite from "../pages/ConfirmInvite";
import ClassRedirect from "../components/redirect/ClassRedirect";
import ClassworkSubmissionsPage from "../pages/ClassSubmission";

const teacherClassRoutes = [
  {
    index: true,
    element: <ClassList />
  },
  {
    path: ClassRouteConfig.TEACHER.CLASS_DETAIL,
    element: <DetailedClassTeacher />
  },
  {
    path: ClassRouteConfig.TEACHER.ADD_CLASSWORK,
    element:<AddEditClassworkForm />
  },
  {
    path: ClassRouteConfig.TEACHER.EDIT_CLASSWORK,
    element:<AddEditClassworkForm />
  },
  {
    path: ClassRouteConfig.TEACHER.CLASSWORK_DETAIL,
    element:<ClassworkDetail />
  },
  {
    path: ClassRouteConfig.TEACHER.CONFIRM_INVITE,
    element:<ConfirmInvite/>
  },
  {
    path: ClassRouteConfig.TEACHER.SUBMISSION_PAGE,
    element:<ClassworkSubmissionsPage/>
  }
];

const studentClassRoutes = [
  {
    index: true,
    element: <ClassList />
  },
  {
    path: ClassRouteConfig.STUDENT.CLASS_DETAIL,
    element: <DetailedClassTeacher />
  },
  {
    path: ClassRouteConfig.STUDENT.CLASSWORK_DETAIL,
    element:<ClassworkDetail />
  },
  {
    path: ClassRouteConfig.TEACHER.CONFIRM_INVITE,
    element:<ConfirmInvite/>
  }
  
];

const classRoutes: RouteObject[] = [
  {
    path: ClassRouteConfig.TEACHER.INDEX,
    element: <Outlet />,
    children: teacherClassRoutes
  },
  {
    path: ClassRouteConfig.STUDENT.INDEX,
    element: <Outlet />,
    children: studentClassRoutes
  }
  ,
  {
    path:"",
    "element":<ClassRedirect/>,

  }
];

export default classRoutes;