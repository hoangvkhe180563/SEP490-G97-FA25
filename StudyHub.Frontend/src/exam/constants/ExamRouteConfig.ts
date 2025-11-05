const ExamRouteConfig = {
  STUDENT: {
    EXAM_LIST: "student/exams",
    EXAM_DETAIL: "student/exams/:id",
    TAKE_EXAM: "student/take-exam/:id",
    EXAM_RESULT_LIST: "student/results",
    CLASS: {
      EXAM_LIST: "student/class/exams",
      EXAM_RESULT_LIST: "student/class/results"
    }
  },
  TEACHER: {
    EXAM_LIST: "teacher/exams",
    CREATE_EXAM: "teacher/create-exam",
    EXAM_DETAILS: "teacher/exams/:id/results",
    EXAM_EDIT: "teacher/exams/:id/edit",
    EXAM_RESULT_LIST: "teacher/results",
    CLASS: {
      EXAM_LIST: "teacher/class/exams",
      EXAM_RESULT_LIST: "teacher/class/results"
    }
  },
  EXAM_RESULT_DETAIL: "results/:id"
};

export default ExamRouteConfig;