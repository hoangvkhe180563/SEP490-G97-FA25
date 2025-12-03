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

const managerRoutes = [
  {
    index: true,
    element: <div>Manager Dashboard</div>,
  },
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
    index: true,
    element: <div>Teacher Dashboard</div>,
  },
  // {
  //   path: DocumentRouteConfig.TEACHER.INFO,
  //   element: <TeacherDocumentInfo />,
  // },
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
    index: true,
    element: <div>Student Dashboard</div>,
  },
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
      <RequireRole allowedRoles={["School Admin", "Document Manager"]}>
        <Outlet />
      </RequireRole>
    ),
    children: managerRoutes,
  },
  {
    path: DocumentRouteConfig.TEACHER.INDEX,
    element: (
      <RequireRole
        allowedRoles={[
          "Subject Teacher",
          "Head of Department Teacher",
          "Q&A Teacher",
          "Homeroom Teacher",
          "Document Manager",
        ]}
      >
        <Outlet />
      </RequireRole>
    ),
    children: teacherRoutes,
  },
  {
    path: DocumentRouteConfig.STUDENT.INDEX,
    element: (
      // <RequireRole
      //   allowedRoles={[
      //     "School Student",
      //     "External Student",
      //     "Document Manager",
      //     "Subject Teacher",
      //     "Homeroom Teacher",
      //   ]}
      // >
      <Outlet />
      // </RequireRole>
    ),
    children: studentRoutes,
  },
  {
    path: "documents",
    element: <DocumentList />,
  },
];

export default documentRoutes;
