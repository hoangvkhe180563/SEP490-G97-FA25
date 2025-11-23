import type { RouteObject } from "react-router-dom";
import ExamRouteConfig from "../constants/ExamRouteConfig";
import TakeExam from "../pages/student/TakeExam";
import TeacherClassResults from "../pages/teacher/ListClassResults";
import ViewResultDetail from "../pages/ViewResultDetail";
import CreateClassExam from "../pages/teacher/CreateClassExam";
import ViewExamHistory from "../pages/teacher/ViewExamHistory";
import UpdateExam from "../pages/teacher/UpdateExam";
import ViewExamDetail from "../pages/student/ViewExamDetail";
import ListQuestions from "../pages/questionManager/ListQuestions";
import AddQuestion from "../pages/questionManager/AddQuestion";
import UpdateQuestion from "../pages/questionManager/UpdateQuestion";

const examRoutes: RouteObject[] = [
  {
    path: ExamRouteConfig.STUDENT.EXAM_DETAIL,
    element: <ViewExamDetail />
  },
  {
    path: ExamRouteConfig.STUDENT.TAKE_EXAM,
    element: <TakeExam />
  },
  {
    path: ExamRouteConfig.EXAM_RESULT_DETAIL,
    element: <ViewResultDetail />
  },
  {
    path: ExamRouteConfig.TEACHER.CREATE_CLASS_EXAM,
    element: <CreateClassExam />
  },
  {
    path: ExamRouteConfig.TEACHER.EXAM_DETAILS,
    element: <ViewExamHistory />
  },
  {
    path: ExamRouteConfig.TEACHER.EDIT_CLASS_EXAM,
    element: <UpdateExam />
  },
  {
    path: ExamRouteConfig.TEACHER.CLASS.EXAM_RESULT_LIST,
    element: <TeacherClassResults />
  },
  {
    path: ExamRouteConfig.QUESTION_MANAGER.QUESTION_LIST,
    element: <ListQuestions />
  },
  {
    path: ExamRouteConfig.QUESTION_MANAGER.CREATE_QUESTION,
    element: <AddQuestion />
  },
  {
    path: ExamRouteConfig.QUESTION_MANAGER.EDIT_QUESTION,
    element: <UpdateQuestion />
  }
];

export default examRoutes;