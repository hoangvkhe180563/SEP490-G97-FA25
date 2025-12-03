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
import { ROLES } from "@/common/constants/Roles";

const examRoutes: RouteObject[] = [
  {
    path: ExamRouteConfig.STUDENT.EXAM_DETAIL,
    element: (
      <RequireRole allowedRoles={[ROLES.SCHOOL_STUDENT]}>
        <ViewExamDetail />
      </RequireRole>
    ),
  },
  {
    path: ExamRouteConfig.STUDENT.TAKE_EXAM,
    element: (
      <RequireRole
        allowedRoles={[ROLES.SCHOOL_STUDENT, ROLES.EXTERNAL_STUDENT]}
      >
        <TakeExam />
      </RequireRole>
    ),
  },
  {
    path: ExamRouteConfig.EXAM_RESULT_DETAIL,
    element: (
      <RequireRole
        allowedRoles={[
          ROLES.SCHOOL_STUDENT,
          ROLES.EXTERNAL_STUDENT,
          ROLES.SUBJECT_TEACHER,
          ROLES.HOMEROOM_TEACHER,
        ]}
      >
        <ViewResultDetail />
      </RequireRole>
    ),
  },
  {
    path: ExamRouteConfig.TEACHER.CREATE_CLASS_EXAM,
    element: (
      <RequireRole
        allowedRoles={[ROLES.SUBJECT_TEACHER, ROLES.HOMEROOM_TEACHER]}
      >
        <CreateClassExam />
      </RequireRole>
    ),
  },
  {
    path: ExamRouteConfig.TEACHER.EXAM_DETAILS,
    element: (
      <RequireRole
        allowedRoles={[ROLES.SUBJECT_TEACHER, ROLES.HOMEROOM_TEACHER]}
      >
        <ViewExamHistory />
      </RequireRole>
    ),
  },
  {
    path: ExamRouteConfig.TEACHER.EDIT_CLASS_EXAM,
    element: (
      <RequireRole
        allowedRoles={[ROLES.SUBJECT_TEACHER, ROLES.HOMEROOM_TEACHER]}
      >
        <UpdateExam />
      </RequireRole>
    ),
  },
  {
    path: ExamRouteConfig.QUESTION_MANAGER.QUESTION_LIST,
    element: (
      <RequireRole allowedRoles={[ROLES.QUESTION_MANAGER, ROLES.SCHOOL_ADMIN]}>
        <ListQuestions />
      </RequireRole>
    ),
  },
  {
    path: ExamRouteConfig.QUESTION_MANAGER.CREATE_QUESTION,
    element: (
      <RequireRole allowedRoles={[ROLES.QUESTION_MANAGER, ROLES.SCHOOL_ADMIN]}>
        <AddQuestion />
      </RequireRole>
    ),
  },
  {
    path: ExamRouteConfig.QUESTION_MANAGER.DASHBOARD,
    element: (
      <RequireRole allowedRoles={[ROLES.QUESTION_MANAGER, ROLES.SCHOOL_ADMIN]}>
        <Dashboard />
      </RequireRole>
    ),
  },
];

export default examRoutes;
