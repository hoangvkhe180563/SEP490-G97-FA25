import type { RouteObject } from "react-router-dom";
import ExamRouteConfig from "../constants/ExamRouteConfig";
import TakeExam from "../pages/student/TakeExam";
import ViewResultDetail from "../pages/ViewResultDetail";
import CreateClassExam from "../pages/teacher/CreateClassExam";
import ViewExamHistory from "../pages/teacher/ViewExamHistory";
import UpdateExam from "../pages/teacher/UpdateClassExam";
import ViewExamDetail from "../pages/student/ViewExamDetail";
import ListQuestions from "../pages/questionManager/ListQuestions";
import AddQuestion from "../pages/questionManager/AddQuestion";
import RequireRole from "@/common/components/RequireRole";
import Dashboard from "../pages/questionManager/Dashboard";

const examRoutes: RouteObject[] = [
  {
    path: ExamRouteConfig.STUDENT.EXAM_DETAIL,
    element: (
      <RequireRole allowedRoles={["School Student", "External Student"]}>
        <ViewExamDetail />
      </RequireRole>
    ),
  },
  {
    path: ExamRouteConfig.STUDENT.TAKE_EXAM,
    element: (
      <RequireRole allowedRoles={["School Student", "External Student"]}>
        <TakeExam />
      </RequireRole>
    ),
  },
  {
    path: ExamRouteConfig.EXAM_RESULT_DETAIL,
    element: (
      <RequireRole allowedRoles={["School Student", "External Student"]}>
        <ViewResultDetail />
      </RequireRole>
    ),
  },
  {
    path: ExamRouteConfig.TEACHER.CREATE_CLASS_EXAM,
    element: (
      <RequireRole
        allowedRoles={[
          "Subject Teacher",
          "Homeroom Teacher",
          "Head of Department Teacher",
          "Q&A Teacher",
        ]}
      >
        <CreateClassExam />
      </RequireRole>
    ),
  },
  {
    path: ExamRouteConfig.TEACHER.EXAM_DETAILS,
    element: (
      <RequireRole
        allowedRoles={[
          "Subject Teacher",
          "Homeroom Teacher",
          "Head of Department Teacher",
          "Q&A Teacher",
        ]}
      >
        <ViewExamHistory />
      </RequireRole>
    ),
  },
  {
    path: ExamRouteConfig.TEACHER.EDIT_CLASS_EXAM,
    element: (
      <RequireRole
        allowedRoles={[
          "Subject Teacher",
          "Homeroom Teacher",
          "Head of Department Teacher",
          "Q&A Teacher",
        ]}
      >
        <UpdateExam />
      </RequireRole>
    ),
  },
  {
    path: ExamRouteConfig.QUESTION_MANAGER.QUESTION_LIST,
    element: (
      <RequireRole
        allowedRoles={[
          "Question Manager",
          "Subject Teacher",
          "Homeroom Teacher",
          "Head of Department Teacher",
          "Q&A Teacher",
          "School Admin",
        ]}
      >
        <ListQuestions />
      </RequireRole>
    ),
  },
  {
    path: ExamRouteConfig.QUESTION_MANAGER.CREATE_QUESTION,
    element: (
      <RequireRole
        allowedRoles={[
          "Question Manager",
          "Subject Teacher",
          "Homeroom Teacher",
          "Head of Department Teacher",
          "Q&A Teacher",
          "School Admin",
        ]}
      >
        <AddQuestion />
      </RequireRole>
    ),
  },
  {
    path: ExamRouteConfig.QUESTION_MANAGER.DASHBOARD,
    element: <Dashboard />,
  },
];

export default examRoutes;
