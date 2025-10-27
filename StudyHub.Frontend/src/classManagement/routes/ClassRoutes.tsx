import ClassList from "@/classManagement/pages/ClassList";
import DetailedClassStudent from "@/classManagement/pages/student/DetailedClassStudent";
import DetailedClassTeacher from "@/classManagement/pages/teacher/DetailedClassTeacher";
import TeacherLayout from "@/user/components/layouts/TeacherLayout";
import StudentLayout from "@/user/components/layouts/StudentLayout";
import ClassRouteConfig from "@/classManagement/constants/ClassRouteConfig";
import type { RouteObject } from "react-router-dom";
import { Edit } from "lucide-react";
import AddEditClassworkForm from "../pages/AddEditClasswork";
import ClassworkDetail from "../pages/ClassworkDetail";

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
  }
];

const studentClassRoutes = [
  {
    index: true,
    element: <ClassList />
  },
  {
    path: ClassRouteConfig.STUDENT.CLASS_DETAIL,
    element: <DetailedClassStudent />
  },
  {
    path: ClassRouteConfig.STUDENT.CLASSWORK_DETAIL,
    element:<ClassworkDetail />
  }
];

const classRoutes: RouteObject[] = [
  {
    path: ClassRouteConfig.TEACHER.INDEX,
    element: <TeacherLayout />,
    children: teacherClassRoutes
  },
  {
    path: ClassRouteConfig.STUDENT.INDEX,
    element: <StudentLayout />,
    children: studentClassRoutes
  }
];

export default classRoutes;
