import DocumentRouteConfig from "@/documentManagement/constants/DocumentRouteConfig";
import ManagerLayout from "@/user/components/layouts/ManagerLayout";
import TeacherLayout from "@/user/components/layouts/TeacherLayout";
import StudentLayout from "@/user/components/layouts/StudentLayout";
import VerifyDocument from "@/documentManagement/pages/manager/VerifyDocument";
import CreateDocument from "@/documentManagement/pages/teacher/CreateDocument";
import DocumentInfo from "@/documentManagement/pages/teacher/DocumentInfo";
import OwnedDocument from "@/documentManagement/pages/teacher/OwnedDocument";
import UpdateDocument from "@/documentManagement/pages/teacher/UpdateDocument";
import DocumentDetails from "@/documentManagement/pages/student/DocumentDetails";
import DocumentList from "@/documentManagement/pages/DocumentList";
import type { RouteObject } from "react-router-dom";

const managerRoutes = [
  {
    index: true,
    element: <div>Manager Dashboard</div>
  },
  {
    path: DocumentRouteConfig.MANAGER.VERIFY,
    element: <VerifyDocument />
  },
  {
    path: DocumentRouteConfig.MANAGER.DETAILS,
    element: <DocumentDetails />
  },
  {
    path: DocumentRouteConfig.MANAGER.INFO,
    element: <DocumentInfo />
  }
]

const teacherRoutes = [
  {
    index: true,
    element: <div>Teacher Dashboard</div>
  },
  {
    path: DocumentRouteConfig.TEACHER.INFO,
    element: <DocumentInfo />
  },
  {
    path: DocumentRouteConfig.TEACHER.DETAILS,
    element: <DocumentDetails />
  },
  {
    path: DocumentRouteConfig.TEACHER.DOCUMENTS,
    element: <OwnedDocument />
  },
  {
    path: DocumentRouteConfig.TEACHER.ADD,
    element: <CreateDocument />
  },
  { 
    path: DocumentRouteConfig.TEACHER.EDIT,
    element: <UpdateDocument />
  }
]

const studentRoutes = [
  {
    index: true,
    element: <div>Student Dashboard</div>
  },
  {
    path: DocumentRouteConfig.STUDENT.DETAILS,
    element: <DocumentDetails />
  },
  {
    path: DocumentRouteConfig.STUDENT.INFO,
    element: <DocumentInfo />
  },
  {
    path: DocumentRouteConfig.STUDENT.DOCUMENTS,
    element: <DocumentList />
  }
]

const documentRoutes: RouteObject[] = [
  {
    path: DocumentRouteConfig.MANAGER.INDEX,
    element: <ManagerLayout />,
    children: managerRoutes
  },
  {
    path: DocumentRouteConfig.TEACHER.INDEX,
    element: <TeacherLayout />,
    children: teacherRoutes
  },
  {
    path: DocumentRouteConfig.STUDENT.INDEX,
    element: <StudentLayout />,
    children: studentRoutes
  },
  {
    path: "documents",
    element: <DocumentList />
  }
];

export default documentRoutes;