const ExamRouteConfig = {
  STUDENT: {
    EXAM_LIST: "student/exams",
    EXAM_DETAIL: "student/exams/:id",
    TAKE_EXAM: "student/take-exam/:id",
    EXAM_RESULT_LIST: "student/results",
  },
  TEACHER: {
    EXAM_LIST: "teacher/exams",
    CREATE_EXAM: "teacher/create-exam",
    EXAM_HISTORY: "teacher/exams/:id/results",
    EXAM_EDIT: "teacher/exams/:id/edit",
    EXAM_RESULT_LIST: "teacher/results"
  },
  EXAM_RESULT_DETAIL: "results/:id"
};

export default ExamRouteConfig;