//src/documentManagement/routes/documentRoutes.tsx
import DocumentRouteConfig from "@/documentManagement/constants/DocumentRouteConfig";
import VerifyDocument from "@/documentManagement/pages/manager/VerifyDocument";
import CreateDocument from "@/documentManagement/pages/teacher/CreateDocument";
// import TeacherDocumentInfo from "@/documentManagement/pages/teacher/DocumentInfo";
import OwnedDocument from "@/documentManagement/pages/teacher/OwnedDocument";
import UpdateDocument from "@/documentManagement/pages/teacher/UpdateDocument";
import DocumentDetails from "@/documentManagement/pages/student/DocumentDetails";
import StudentDocumentInfo from "@/documentManagement/pages/DocumentInfo";
import DocumentList from "@/documentManagement/pages/DocumentList";
import { Outlet, type RouteObject } from "react-router-dom";
import RequireRole from "@/common/components/RequireRole";
import DocumentDashboard from "../pages/manager/DocumentDashboard";
import SchoolTeachersDocuments from "../pages/teacher/SchoolTeachersDocuments";
import { ROLES } from "@/common/constants/Roles";
import ProtectedRoute from "@/common/components/ProtectedRoute";

const managerRoutes = [
  {
    path: DocumentRouteConfig.MANAGER.VERIFY,
    element: <VerifyDocument />,
  },
  {
    path: DocumentRouteConfig.MANAGER.DETAILS,
    element: <DocumentDetails />,
  },
  {
    path: DocumentRouteConfig.MANAGER.DASHBOARD,
    element: <DocumentDashboard />,
  },
  {
    path: DocumentRouteConfig.MANAGER.INFO,
    element: <StudentDocumentInfo />,
  },
];

const teacherRoutes = [
  {
    path: DocumentRouteConfig.TEACHER.DETAILS,
    element: <DocumentDetails />,
  },
  {
    path: DocumentRouteConfig.TEACHER.MYDOCUMENTS,
    element: <OwnedDocument />,
  },
  {
    path: DocumentRouteConfig.TEACHER.ADD,
    element: <CreateDocument />,
  },
  {
    path: DocumentRouteConfig.TEACHER.EDIT,
    element: <UpdateDocument />,
  },
  {
    path: DocumentRouteConfig.TEACHER.DOCUMENTS,
    element: <SchoolTeachersDocuments />,
  },
];

const studentRoutes = [
  {
    path: DocumentRouteConfig.STUDENT.DETAILS,
    element: <DocumentDetails />,
  },
  {
    path: DocumentRouteConfig.STUDENT.INFO,
    element: <StudentDocumentInfo />,
  },
  {
    path: DocumentRouteConfig.STUDENT.DOCUMENTS,
    element: <DocumentList />,
  },
];

const documentRoutes: RouteObject[] = [
  {
    path: DocumentRouteConfig.MANAGER.INDEX,
    element: (
      <ProtectedRoute>
        <RequireRole allowedRoles={[ROLES.DOCUMENT_MANAGER]}>
          <Outlet />
        </RequireRole>
      </ProtectedRoute>
    ),
    children: managerRoutes,
  },
  {
    path: DocumentRouteConfig.TEACHER.INDEX,
    element: (
      <ProtectedRoute>
        <RequireRole
          allowedRoles={[
            ROLES.SUBJECT_TEACHER,
            ROLES.HOMEROOM_TEACHER,
            ROLES.HEAD_TEACHER,
          ]}
        >
          <Outlet />
        </RequireRole>
      </ProtectedRoute>
    ),
    children: teacherRoutes,
  },
  {
    path: DocumentRouteConfig.STUDENT.INDEX,
    element: <Outlet />,
    children: studentRoutes,
  },
];

export default documentRoutes;
