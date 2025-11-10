import type { RouteObject } from "react-router-dom";
import ExamRouteConfig from "../constants/ExamRouteConfig";
import StudentClassExams from "../pages/student/ListClassExams";
import TeacherClassExams from "../pages/teacher/ListClassExams";
import TakeExam from "../pages/student/TakeExam";
import StudentListResults from "../pages/student/ListResults";
import TeacherClassResults from "../pages/teacher/ListClassResults";
import ViewResultDetail from "../pages/ViewResultDetail";
import CreateExam from "../pages/teacher/CreateExam";
import ViewExamHistory from "../pages/teacher/ViewExamHistory";
import UpdateExam from "../pages/teacher/UpdateExam";
import ViewExamDetail from "../pages/student/ViewExamDetail";
import TeacherLessonExam from "../pages/teacher/LessonExam";

const examRoutes: RouteObject[] = [
  {
    path: ExamRouteConfig.STUDENT.CLASS.EXAM_LIST,
    element: <StudentClassExams />
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
    element: <TeacherClassExams />
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
    path: ExamRouteConfig.TEACHER.EDIT_EXAM,
    element: <UpdateExam />
  },
  {
    path: ExamRouteConfig.TEACHER.CLASS.EXAM_RESULT_LIST,
    element: <TeacherClassResults />
  },
  {
    path: ExamRouteConfig.TEACHER.LESSON.LESSON_EXAM,
    element: <TeacherLessonExam />
  }
];

export default examRoutes;