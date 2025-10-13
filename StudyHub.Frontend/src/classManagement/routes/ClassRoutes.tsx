import ClassList from "@/classManagement/pages/ClassList";
import DetailedClassStudent from "@/classManagement/pages/student/DetailedClassStudent";
import DetailedClassTeacher from "@/classManagement/pages/teacher/DetailedClassTeacher";
import TeacherLayout from "@/user/components/layouts/TeacherLayout";
import StudentLayout from "@/user/components/layouts/StudentLayout";
import ClassRouteConfig from "@/classManagement/constants/ClassRouteConfig";
import type { RouteObject } from "react-router-dom";

const teacherClassRoutes = [
  {
    index: true,
    element: <ClassList />
  },
  {
    path: ClassRouteConfig.TEACHER.CLASS_DETAIL,
    element: <DetailedClassTeacher />
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
