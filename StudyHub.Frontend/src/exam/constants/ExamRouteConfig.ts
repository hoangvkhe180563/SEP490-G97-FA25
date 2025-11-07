const ExamRouteConfig = {
  STUDENT: {
    EXAM_LIST: "student/exams",
    EXAM_DETAIL: "student/exams/:id",
    TAKE_EXAM: "student/take-exam/:id",
    EXAM_RESULT_LIST: "student/results",
    CLASS: {
      EXAM_LIST: "student/class-exams",
      EXAM_RESULT_LIST: "student/class-exams/results"
    }
  },
  TEACHER: {
    EXAM_LIST: "teacher/exams",
    EXAM_DETAILS: "teacher/exams/:id/results",
    EXAM_RESULT_LIST: "teacher/results",
    CLASS: {
      EXAM_LIST: "teacher/class-exams/:classId",
      CREATE_EXAM: "teacher/class-exams/create-exam",
      EXAM_EDIT: "teacher/class-exams/:id/edit",
      EXAM_DETAILS: "teacher/class-exams/:id/results",
      EXAM_RESULT_LIST: "teacher/class-exams/results"
    }
  },
  EXAM_RESULT_DETAIL: "results/:id"
};

export default ExamRouteConfig;