import type { RouteObject } from "react-router-dom";
import ExamRouteConfig from "../constants/ExamRouteConfig";
import StudentListExams from "../pages/student/ListClassExams";
import TeacherListExams from "../pages/teacher/ListClassExams";
import TakeExam from "../pages/student/TakeExam";
import StudentListResults from "../pages/student/ListClassResults";
import TeacherListResults from "../pages/teacher/ListClassResults";
import ViewResultDetail from "../pages/ViewResultDetail";
import CreateExam from "../pages/teacher/CreateExam";
import ViewExamHistory from "../pages/teacher/ViewExamHistory";
import UpdateExam from "../pages/teacher/UpdateExam";
import ViewExamDetail from "../pages/student/ViewExamDetail";

const examRoutes: RouteObject[] = [
  {
    path: ExamRouteConfig.STUDENT.CLASS.EXAM_LIST,
    element: <StudentListExams />
  },
  {
    path: ExamRouteConfig.STUDENT.EXAM_DETAIL,
    element: <ViewExamDetail />
  },
  {
    path: ExamRouteConfig.STUDENT.TAKE_EXAM,
    element: <TakeExam />
  },
  {
    path: ExamRouteConfig.STUDENT.CLASS.EXAM_RESULT_LIST,
    element: <StudentListResults />
  },
  {
    path: ExamRouteConfig.EXAM_RESULT_DETAIL,
    element: <ViewResultDetail />
  },
  {
    path: ExamRouteConfig.TEACHER.CLASS.EXAM_LIST,
    element: <TeacherListExams />
  },
  {
    path: ExamRouteConfig.TEACHER.CREATE_EXAM,
    element: <CreateExam />
  },
  {
    path: ExamRouteConfig.TEACHER.EXAM_DETAILS,
    element: <ViewExamHistory />
  },
  {
    path: ExamRouteConfig.TEACHER.EXAM_EDIT,
    element: <UpdateExam />
  },
  {
    path: ExamRouteConfig.TEACHER.CLASS.EXAM_RESULT_LIST,
    element: <TeacherListResults />
  },
];

export default examRoutes;