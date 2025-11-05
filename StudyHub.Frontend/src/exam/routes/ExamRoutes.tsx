import type { RouteObject } from "react-router-dom";
import ExamRouteConfig from "../constants/ExamRouteConfig";
import StudentListExams from "../pages/student/ListExams";
import TeacherListExams from "../pages/teacher/ListExams";
import TakeExam from "../pages/student/TakeExam";
import StudentListResults from "../pages/student/ListResults";
import TeacherListResults from "../pages/teacher/ListResults";
import ViewResultDetail from "../pages/ViewResultDetail";
import CreateExam from "../pages/teacher/CreateExam";
import ViewExamHistory from "../pages/teacher/ViewExamHistory";
import UpdateExam from "../pages/teacher/UpdateExam";
import ViewExamDetail from "../pages/student/ViewExamDetail";

const examRoutes: RouteObject[] = [
  {
    path: ExamRouteConfig.STUDENT.EXAM_LIST,
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
    path: ExamRouteConfig.STUDENT.EXAM_RESULT_LIST,
    element: <StudentListResults />
  },
  {
    path: ExamRouteConfig.EXAM_RESULT_DETAIL,
    element: <ViewResultDetail />
  },
  {
    path: ExamRouteConfig.TEACHER.EXAM_LIST,
    element: <TeacherListExams />
  },
  {
    path: ExamRouteConfig.TEACHER.CREATE_EXAM,
    element: <CreateExam />
  },
  {
    path: ExamRouteConfig.TEACHER.EXAM_HISTORY,
    element: <ViewExamHistory />
  },
  {
    path: ExamRouteConfig.TEACHER.EXAM_EDIT,
    element: <UpdateExam />
  },
  {
    path: ExamRouteConfig.TEACHER.EXAM_RESULT_LIST,
    element: <TeacherListResults />
  },
];

export default examRoutes;